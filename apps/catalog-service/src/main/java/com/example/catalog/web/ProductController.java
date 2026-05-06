package com.example.catalog.web;

import com.example.common.Money;
import com.example.common.Sku;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {

  private static final Map<String, Money> CATALOG =
      Map.of(
          "ABC-123", Money.usd("19.99"),
          "DEF-456", Money.usd("49.50"));

  @GetMapping("/products/{sku}")
  public ResponseEntity<Map<String, Object>> getProduct(@PathVariable String sku) {
    var key = new Sku(sku);
    var price = CATALOG.get(key.value());
    if (price == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(Map.of("sku", key.value(), "price", price.amount(), "currency", price.currency().getCurrencyCode()));
  }
}
