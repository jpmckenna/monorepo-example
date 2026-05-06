package com.example.orders.web;

import com.example.common.Money;
import com.example.common.Sku;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {

  private final ConcurrentHashMap<String, Map<String, Object>> orders = new ConcurrentHashMap<>();

  public record CreateOrderRequest(String sku, String amount) {}

  @PostMapping("/orders")
  public ResponseEntity<Map<String, Object>> create(@RequestBody CreateOrderRequest req) {
    var sku = new Sku(req.sku());
    var price = Money.usd(req.amount());
    var id = UUID.randomUUID().toString();
    var order =
        Map.<String, Object>of(
            "id", id, "sku", sku.value(), "price", price.amount(), "currency", price.currency().getCurrencyCode());
    orders.put(id, order);
    return ResponseEntity.ok(order);
  }

  @GetMapping("/orders/{id}")
  public ResponseEntity<Map<String, Object>> get(@PathVariable String id) {
    var order = orders.get(id);
    return order == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(order);
  }
}
