package com.example.catalog.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

  @Autowired MockMvc mvc;

  @Test
  void returnsKnownProduct() throws Exception {
    mvc.perform(get("/products/ABC-123"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sku").value("ABC-123"))
        .andExpect(jsonPath("$.currency").value("USD"));
  }

  @Test
  void returnsNotFoundForUnknownSku() throws Exception {
    mvc.perform(get("/products/ZZZ-999")).andExpect(status().isNotFound());
  }
}
