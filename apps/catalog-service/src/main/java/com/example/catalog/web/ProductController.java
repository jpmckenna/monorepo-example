package com.example.catalog.web;

import com.example.common.Money;
import com.example.common.Sku;
import com.example.common.Product;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {

  private static final Map<String, Product> CATALOG =
      Map.of(
          "ABC-123", new Product(new Sku("ABC-123"), Money.usd("19.99"), 3),
          "DEF-456", new Product(new Sku("DEF-456"), Money.usd("49.50"), 100));

  @GetMapping("/products/{sku}")
  public ResponseEntity<Map<String, Object>> getProduct(@PathVariable String sku) {
    var product = CATALOG.get(sku);
    if (product == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(Map.of(
        "sku", product.sku().value(),
        "price", product.price().amount(),
        "currency", product.price().currency().getCurrencyCode(),
        "inventoryCount", product.inventoryCount()));
  }
}
