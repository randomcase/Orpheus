package org.orpheus.research.model;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "primary_passages")
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class PassageEntity {
    @Id
    private String id;
    private String work;
    private String locus;
    private String dateLabel;
    private String scriptType;

    @Column(length = 4000)
    private String originalText;

    @Column(length = 4000)
    private String literalGloss;

    @Column(length = 4000)
    private String englishTranslation;

    @Column(length = 4000)
    private String philologicalNotes;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getWork() { return work; }
    public void setWork(String work) { this.work = work; }
    public String getLocus() { return locus; }
    public void setLocus(String locus) { this.locus = locus; }
    public String getDateLabel() { return dateLabel; }
    public void setDateLabel(String dateLabel) { this.dateLabel = dateLabel; }
    public String getScriptType() { return scriptType; }
    public void setScriptType(String scriptType) { this.scriptType = scriptType; }
    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }
    public String getLiteralGloss() { return literalGloss; }
    public void setLiteralGloss(String literalGloss) { this.literalGloss = literalGloss; }
    public String getEnglishTranslation() { return englishTranslation; }
    public void setEnglishTranslation(String englishTranslation) { this.englishTranslation = englishTranslation; }
    public String getPhilologicalNotes() { return philologicalNotes; }
    public void setPhilologicalNotes(String philologicalNotes) { this.philologicalNotes = philologicalNotes; }
}
