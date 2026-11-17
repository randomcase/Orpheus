package org.orpheus.research.model;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "anthropology_motif_c331")
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class AnthropologyEntity {
    @Id
    private String id;
    private String cultureOrRegion;
    private String traditionOrMyth;
    private String figures;

    @Column(length = 4000)
    private String tabooMechanism;

    @Column(length = 4000)
    private String outcomeOfGlance;

    @Column(length = 1000)
    private String anthropologistOrScholar;

    @Column(length = 4000)
    private String structuralMeaning;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCultureOrRegion() { return cultureOrRegion; }
    public void setCultureOrRegion(String cultureOrRegion) { this.cultureOrRegion = cultureOrRegion; }
    public String getTraditionOrMyth() { return traditionOrMyth; }
    public void setTraditionOrMyth(String traditionOrMyth) { this.traditionOrMyth = traditionOrMyth; }
    public String getFigures() { return figures; }
    public void setFigures(String figures) { this.figures = figures; }
    public String getTabooMechanism() { return tabooMechanism; }
    public void setTabooMechanism(String tabooMechanism) { this.tabooMechanism = tabooMechanism; }
    public String getOutcomeOfGlance() { return outcomeOfGlance; }
    public void setOutcomeOfGlance(String outcomeOfGlance) { this.outcomeOfGlance = outcomeOfGlance; }
    public String getAnthropologistOrScholar() { return anthropologistOrScholar; }
    public void setAnthropologistOrScholar(String anthropologistOrScholar) { this.anthropologistOrScholar = anthropologistOrScholar; }
    public String getStructuralMeaning() { return structuralMeaning; }
    public void setStructuralMeaning(String structuralMeaning) { this.structuralMeaning = structuralMeaning; }
}
