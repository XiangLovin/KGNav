package chen.kgnav.util;

import chen.kgnav.entity.AtomicGraph;
import chen.kgnav.entity.Hypernodes;
import org.apache.jena.query.ReadWrite;
import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdfconnection.RDFConnection;
import org.apache.jena.rdfconnection.RDFConnectionFuseki;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

import static java.util.stream.Collectors.toList;

public class ClusterGenerator {

    public static String fusekiServerURL = "http://152.136.45.252:8081/dp";
    //获取底层原子图
    public static AtomicGraph getAtomicGraph(String Id) {
        System.out.println("ccc "+ Id);
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
        AtomicGraph atomicGraph = new AtomicGraph(Id, inlabels, outlabels);
        return atomicGraph;
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
    public static Map<String, Object> getCluster(List<Map<String, Object>> nodes, List<Map<String, Object>> edges ) throws IOException {
        int nodeNumber = nodes.size();
        boolean changeNum = true;
        //相似性矩阵
        Double[][] similarity = new Double[nodeNumber][nodeNumber];

        List<Hypernodes> hypernodes = new ArrayList();
        Map<String,AtomicGraph> atomicMap = new HashMap<>();
        //init
        for (Map<String, Object> node:nodes) {
            Hypernodes hyper = new Hypernodes(node.get("id").toString(),node.get("value").toString());
            hyper.setNodes(new HashMap<>());
            hypernodes.add(hyper);
            //atomicMap.put(node.get("id").toString(),getAtomicGraph(node.get("id").toString()));
        }
        //计算矩阵
        for(int i = 0;i<nodeNumber;i++){
            for(int j = i+1;j<nodeNumber;j++){
                //double simi = calculateSimilarity(atomicMap.get(),atomicMap.get());
                //similarity[i][j] = similarity[j][i] = simi;
            }
        }
        while(changeNum){




        }
        Map<String,Object> clusters = new HashMap<>();
        return clusters;
    }

}
