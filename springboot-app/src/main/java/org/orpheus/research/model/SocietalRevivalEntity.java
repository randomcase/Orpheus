package org.orpheus.research.model;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "societal_revivals")
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class SocietalRevivalEntity {
    @Id
    private String id;

    @Column(name = "revival_year")
    private int year;

    @Column(length = 1000)
    private String workAndCreator;

    private String medium;

    @Column(length = 4000)
    private String historicalCrisisOrShift;

    @Column(length = 4000)
    private String howTheEndingChanges;

    @Column(length = 4000)
    private String culturalImpact;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public String getWorkAndCreator() { return workAndCreator; }
    public void setWorkAndCreator(String workAndCreator) { this.workAndCreator = workAndCreator; }
    public String getMedium() { return medium; }
    public void setMedium(String medium) { this.medium = medium; }
    public String getHistoricalCrisisOrShift() { return historicalCrisisOrShift; }
    public void setHistoricalCrisisOrShift(String historicalCrisisOrShift) { this.historicalCrisisOrShift = historicalCrisisOrShift; }
    public String getHowTheEndingChanges() { return howTheEndingChanges; }
    public void setHowTheEndingChanges(String howTheEndingChanges) { this.howTheEndingChanges = howTheEndingChanges; }
    public String getCulturalImpact() { return culturalImpact; }
    public void setCulturalImpact(String culturalImpact) { this.culturalImpact = culturalImpact; }
}
