package com.bloodlink.model;

import jakarta.persistence.*;

@Entity
@Table(name = "blood_groups")
public class BloodGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String name;

    public BloodGroup() {
    }

    public BloodGroup(String name) {
        this.name = name;
    }

    public BloodGroup(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
