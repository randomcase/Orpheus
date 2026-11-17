package org.orpheus.research.model;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "timeline_milestones")
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class TimelineMilestoneEntity {
    @Id
    private String id;

    @Column(name = "milestone_year")
    private int year;

    private String displayDate;
    private String era;
    private String title;
    private String creatorOrSource;
    private String language;

    @Column(length = 4000)
    private String discoveryOrProvenance;

    @Column(length = 4000)
    private String keyShift;

    @Column(length = 4000)
    private String liturgicalOrReligiousRole;

    @Column(length = 4000)
    private String societalContext;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public String getDisplayDate() { return displayDate; }
    public void setDisplayDate(String displayDate) { this.displayDate = displayDate; }
    public String getEra() { return era; }
    public void setEra(String era) { this.era = era; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCreatorOrSource() { return creatorOrSource; }
    public void setCreatorOrSource(String creatorOrSource) { this.creatorOrSource = creatorOrSource; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getDiscoveryOrProvenance() { return discoveryOrProvenance; }
    public void setDiscoveryOrProvenance(String discoveryOrProvenance) { this.discoveryOrProvenance = discoveryOrProvenance; }
    public String getKeyShift() { return keyShift; }
    public void setKeyShift(String keyShift) { this.keyShift = keyShift; }
    public String getLiturgicalOrReligiousRole() { return liturgicalOrReligiousRole; }
    public void setLiturgicalOrReligiousRole(String liturgicalOrReligiousRole) { this.liturgicalOrReligiousRole = liturgicalOrReligiousRole; }
    public String getSocietalContext() { return societalContext; }
    public void setSocietalContext(String societalContext) { this.societalContext = societalContext; }
}
