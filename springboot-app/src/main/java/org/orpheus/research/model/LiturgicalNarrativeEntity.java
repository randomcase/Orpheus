package org.orpheus.research.model;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "liturgical_catholic_narratives")
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class LiturgicalNarrativeEntity {
    @Id
    private String id;
    private String tradition;
    private String period;

    @Column(length = 1000)
    private String artifactOrText;

    @Column(length = 4000)
    private String theologicalMapping;

    @Column(length = 4000)
    private String ritualOrLiturgicalUse;

    @Column(length = 4000)
    private String christologicalComparison;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTradition() { return tradition; }
    public void setTradition(String tradition) { this.tradition = tradition; }
    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }
    public String getArtifactOrText() { return artifactOrText; }
    public void setArtifactOrText(String artifactOrText) { this.artifactOrText = artifactOrText; }
    public String getTheologicalMapping() { return theologicalMapping; }
    public void setTheologicalMapping(String theologicalMapping) { this.theologicalMapping = theologicalMapping; }
    public String getRitualOrLiturgicalUse() { return ritualOrLiturgicalUse; }
    public void setRitualOrLiturgicalUse(String ritualOrLiturgicalUse) { this.ritualOrLiturgicalUse = ritualOrLiturgicalUse; }
    public String getChristologicalComparison() { return christologicalComparison; }
    public void setChristologicalComparison(String christologicalComparison) { this.christologicalComparison = christologicalComparison; }
}
