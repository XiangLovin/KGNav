package chen.kgnav;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AtomicGraph {
    private List<String> inLabels;
    private List<String> outLabels;
    private String Id;

    public AtomicGraph(List<String> inLabels, List<String> outLabels, String id) {
        this.inLabels = inLabels;
        this.outLabels = outLabels;
        Id = id;
    }
    public List<String> getInLabels() {
        return inLabels;
    }

    public void setInLabels(List<String> inLabels) {
        this.inLabels = inLabels;
    }

    public List<String> getOutLabels() {
        return outLabels;
    }

    public void setOutLabels(List<String> outLabels) {
        this.outLabels = outLabels;
    }

    public String getId() {
        return Id;
    }

    public void setId(String id) {
        Id = id;
    }
}
