package org.orpheus.research;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OrpheusApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void seedsCorpusAndExposesResearchEndpoints() throws Exception {
        mockMvc.perform(get("/api/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.timeline", greaterThanOrEqualTo(18)))
                .andExpect(jsonPath("$.counts.transliterations", greaterThanOrEqualTo(10)))
                .andExpect(jsonPath("$.counts.catholic_liturgical", greaterThanOrEqualTo(8)))
                .andExpect(jsonPath("$.counts.anthropology", greaterThanOrEqualTo(8)))
                .andExpect(jsonPath("$.counts.societal_revivals", greaterThanOrEqualTo(10)));

        mockMvc.perform(get("/api/timeline"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(18))))
                .andExpect(jsonPath("$[0].id").value("TL-01"));

        mockMvc.perform(get("/api/catholic-liturgical"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(8))));

        mockMvc.perform(get("/api/anthropology"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(8))));

        mockMvc.perform(get("/api/revivals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(10))));

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        mockMvc.perform(post("/api/katabasis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"steps\":10,\"look_back_step\":9}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("RELAPSA_INTO_AVERNO"));
    }
}
