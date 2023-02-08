package chen.kgnav;

import com.alibaba.fastjson.JSONObject;
import org.apache.commons.io.FileUtils;
import org.apache.jena.query.ReadWrite;
import org.apache.jena.rdf.model.*;
import org.apache.jena.rdfconnection.RDFConnection;
import org.apache.jena.rdfconnection.RDFConnectionFuseki;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;


@RestController
public class JenaController {

    // Fuseki连接
    public static String fusekiServerURL = "http://152.136.45.252:8081/dp";

    // 前缀空间
    private String kgnavPrefix = "http://www.tju.edu.cn/kgnav#";
    private String rdfPrefix = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
    private String asPrefix = "https://www.w3.org/ns/activitystreams#";

    // 本体类型定义
    Model tempModel = ModelFactory.createDefaultModel();

    // DataProperty
    Property dataName = tempModel.createProperty("property:", "name");


    public static Map<String, Object> getClusters() throws IOException {
        File file = new File("/Users/chenzirui/Desktop/data.json");
        String content = FileUtils.readFileToString(file,"UTF-8");

        JSONObject jsonObject = JSONObject.parseObject(content);
        //json对象转Map
        Map<String,Object> clusters = jsonObject;
        clusters.remove("nodes");
        clusters.remove("edges");

        return clusters;
    }

    @CrossOrigin
    @GetMapping("/browse")
    public Map<String, Object> getMajorGraph() {

        Map<String, Object> majorGraph = new HashMap();

        // 依次将课程对应节点进行遍历
        try (RDFConnection conn = RDFConnectionFuseki.create().destination(fusekiServerURL).build()) {
            List<Map<String, Object>> nodes = new ArrayList();
            List<Map<String, Object>> edges = new ArrayList();
            conn.begin(ReadWrite.READ);
            try {
                conn.querySelect("SELECT ?subject ?predicate ?object WHERE { ?subject ?predicate ?object }", (qs) -> {
                    Resource subject = qs.getResource("subject");
                    Resource predicate = qs.getResource("predicate");
                    List<String> split_relation = new ArrayList<>(Arrays.asList(predicate.toString().split(":")));

                    if (predicate.equals(dataName)) {
                        Map<String, Object> node = new HashMap<>();
                        List<String> split = new ArrayList<>(Arrays.asList(subject.toString().split(":")));
                        node.put("id", split.get(1));
                        Literal object = qs.getLiteral("object");
                        node.put("value", object.toString());
                        nodes.add(node);
                    } else if (split_relation.get(0).equals("relation")) {
                        Map<String, Object> edge = new HashMap<>();
                        List<String> split_head = new ArrayList<>(Arrays.asList(subject.toString().split(":")));
                        edge.put("source", split_head.get(1));
                        Resource object = qs.getResource("object");
                        List<String> split_tail = new ArrayList<>(Arrays.asList(object.toString().split(":")));
                        edge.put("target", split_tail.get(1));
                        edge.put("value", split_relation.get(1));
                        edges.add(edge);
                    }
                });

                majorGraph.put("code", "200");
                majorGraph.put("nodes", nodes);
                majorGraph.put("edges", edges);
                Map<String, Object> clusters = getClusters();
                majorGraph.put("clusters", clusters.get("clusters"));
                conn.commit();
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                conn.end();
            }
        }
        System.out.println("1111111111111111111111111111");
        return majorGraph;
    }

    @CrossOrigin
    @GetMapping("/getEntityInfo")
    public Map<String, Object> getEntityInfo(@RequestParam(name = "search", required = true) String search) {
        Map<String, Object> entityInfo = new HashMap<>();
        AtomicReference<String> entityId = new AtomicReference<>("");
        List<Map<String,String>> properties = new ArrayList<>();

        System.out.println(search);

        try (RDFConnection conn = RDFConnectionFuseki.create().destination(fusekiServerURL).build()) {
            conn.begin(ReadWrite.READ);
            // 实体ID
            try {
                conn.querySelect("SELECT ?subject WHERE {  ?subject <property:name> \"" + search + "\" }", (qs) -> {
                    Resource subject = qs.getResource("subject");
                    List<String> split_head = new ArrayList<>(Arrays.asList(subject.toString().split(":")));
                    entityId.set(split_head.get(1));
                });
                conn.commit();
            } finally {
                conn.end();
            }

            try {
                conn.querySelect("SELECT ?predicate ?object WHERE {  <kgnav:" + entityId + "> ?predicate ?object }", (qs) -> {
                    Resource predicate = qs.getResource("predicate");
                    List<String> split_property = new ArrayList<>(Arrays.asList(predicate.toString().split(":")));
                    if (split_property.get(0).equals("relation")) {
                        ;
                    } else {
                        Literal object = qs.getLiteral("object");
                        Map<String,String> property = new HashMap<>();
                        property.put(split_property.get(1),object.toString());
                        properties.add(property);
                    }
                });
                conn.commit();
            } finally {
                conn.end();
            }
        }

        entityInfo.put("name",search);
        entityInfo.put("imgUrl","null");
        entityInfo.put("link","https://www.wikidata.org/wiki/"+entityId);
        entityInfo.put("properties",properties);

        return entityInfo;
    }
}
