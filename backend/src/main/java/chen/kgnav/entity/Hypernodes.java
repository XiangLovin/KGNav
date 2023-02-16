package chen.kgnav.entity;

import java.util.List;
import java.util.Map;
import lombok.Data;
@Data

public class Hypernodes {
    private String Id;
    private String value;
    private Map<String,Object> nodes;
    private int level;

    public Hypernodes(String id, String value) {
        Id = id;
        this.value = value;
        level = 0;
    }

    public Map<String, Object> getNodes() {
        return nodes;
    }

    public void setNodes(Map<String, Object> nodes) {
        this.nodes = nodes;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }
}
