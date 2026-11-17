package org.orpheus.research.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "generational_lineage")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class GenerationLineageEntity {
    @Id
    private String id;

    private int genNumber;
    private int yearStart;
    private int yearEnd;
    private String displaySpan;
    private String era;
    private String role;
    private String primaryStream;
    private boolean isCapsuleOrigin;

    @Column(length = 4000)
    private String custodianOrWitness;

    @Column(length = 4000)
    private String transmissionNote;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getGenNumber() { return genNumber; }
    public void setGenNumber(int genNumber) { this.genNumber = genNumber; }
    public int getYearStart() { return yearStart; }
    public void setYearStart(int yearStart) { this.yearStart = yearStart; }
    public int getYearEnd() { return yearEnd; }
    public void setYearEnd(int yearEnd) { this.yearEnd = yearEnd; }
    public String getDisplaySpan() { return displaySpan; }
    public void setDisplaySpan(String displaySpan) { this.displaySpan = displaySpan; }
    public String getEra() { return era; }
    public void setEra(String era) { this.era = era; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPrimaryStream() { return primaryStream; }
    public void setPrimaryStream(String primaryStream) { this.primaryStream = primaryStream; }
    public boolean isCapsuleOrigin() { return isCapsuleOrigin; }
    public void setCapsuleOrigin(boolean isCapsuleOrigin) { this.isCapsuleOrigin = isCapsuleOrigin; }
    public String getCustodianOrWitness() { return custodianOrWitness; }
    public void setCustodianOrWitness(String custodianOrWitness) { this.custodianOrWitness = custodianOrWitness; }
    public String getTransmissionNote() { return transmissionNote; }
    public void setTransmissionNote(String transmissionNote) { this.transmissionNote = transmissionNote; }
}
