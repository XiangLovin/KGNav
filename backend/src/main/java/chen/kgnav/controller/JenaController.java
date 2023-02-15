package chen.kgnav.controller;

import chen.kgnav.entity.AtomicGraph;
import chen.kgnav.entity.Hypernodes;
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

import static java.util.stream.Collectors.toList;


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

    //获取底层原子图
    public static AtomicGraph getAtomicGraph(String Id) {
        List<String> inlabels = new ArrayList<>();
        List<String> outlabels = new ArrayList<>();
        try (RDFConnection conn = RDFConnectionFuseki.create().destination(fusekiServerURL).build()) {
            conn.begin(ReadWrite.READ);
            //get outlabels
            try {
                conn.querySelect("SELECT DISTINCT ?predicate ?object WHERE { <kgnav:" + Id + "> ?predicate ?object}", (qs) -> {
                    Resource predicate = qs.getResource("predicate");
                    List<String> split_relation = new ArrayList<>(Arrays.asList(predicate.toString().split(":")));
                    if (split_relation.get(0).equals("relation"))
                        outlabels.add(split_relation.get(1));
                });
                conn.commit();
            } finally {
                conn.end();
            }
            //get inlabels
            try {
                conn.querySelect("SELECT DISTINCT ?predicate WHERE { ?subject ?predicate <kgnav:" + Id + "> }", (qs) -> {
                    Resource predicate = qs.getResource("predicate");
                    List<String> split_relation = new ArrayList<>(Arrays.asList(predicate.toString().split(":")));
                    if (split_relation.get(0).equals("relation"))
                        inlabels.add(split_relation.get(1));
                });
                conn.commit();
            } finally {
                conn.end();
            }
        }
        return new AtomicGraph(Id,inlabels,outlabels);
    }
    public static double calculateSimilarity(AtomicGraph atomic1,AtomicGraph atomic2){
        List<String> In1 = atomic1.getInLabels();
        List<String> In2 = atomic2.getInLabels();
        List<String> Out1 = atomic1.getOutLabels();
        List<String> Out2 = atomic2.getOutLabels();
        List<String> interIn = In1.stream().filter(item -> In2.contains(item)).collect(toList());
        List<String> interOut = Out1.stream().filter(item -> Out2.contains(item)).collect(toList());
        int maxIn = Math.max(In1.size(),In2.size());
        int maxOut = Math.max(Out1.size(),Out2.size());
        return (interIn.size() + interOut.size())/(maxIn + maxOut);
    }
    //cluster生成
    public static Map<String, Object> clustersGenerator(List<Map<String, Object>> nodes,List<Map<String, Object>> edges ) throws IOException {
        int nodeNumber = nodes.size();
        boolean changeNum = true;
        //相似性矩阵
        Double[][] similarity = new Double[nodeNumber][nodeNumber];
        List<Hypernodes> hypernodes = new ArrayList();
        Map<String,AtomicGraph> nodeMap = new HashMap<>();
        //init
        for (Map<String, Object> node:nodes) {
            Hypernodes hyper = new Hypernodes(node.get("id").toString(),node.get("value").toString());
            hyper.setNodes(new HashMap<>());
            hypernodes.add(hyper);
            nodeMap.put(node.get("id").toString(),getAtomicGraph(node.get("id").toString()));
        }
        //计算矩阵
        for(int i = 0;i<nodeNumber;i++){
            for(int j = i+1;j<nodeNumber;j++){
                int simi = calculateSimilarity(nodeMap.get(nodes[i].get("id")))
            }
        }
        while(changeNum){




        }
        Map<String,Object> clusters = new HashMap<>();
        return clusters;
    }


    public static Map<String, Object> getClusters() throws IOException {
        File file = new File("../data.json");
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
        System.out.println("22222111111111111");

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
                //Map<String, Object> clusters = getClusters();
                Map<String, Object> clusters = clustersGenerator(nodes,edges);
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
