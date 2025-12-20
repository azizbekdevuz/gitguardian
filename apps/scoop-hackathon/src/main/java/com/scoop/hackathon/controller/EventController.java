package com.scoop.hackathon.controller;

import com.scoop.hackathon.dto.CreateEventRequest;
import com.scoop.hackathon.dto.EventDto;
import com.scoop.hackathon.dto.UpdateEventRequest;
import com.scoop.hackathon.payload.ApiResponse;
import com.scoop.hackathon.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }
    
    @PostMapping
    public ResponseEntity<EventDto> createEvent(@Valid @RequestBody CreateEventRequest request) {
        EventDto event = eventService.createEvent(request);
        return new ResponseEntity<>(event, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getEventById(@PathVariable String id) {
        EventDto event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }
    
    @GetMapping
    public ResponseEntity<List<EventDto>> getAllEvents() {
        List<EventDto> events = eventService.getAllEvents();
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<EventDto>> getEventsByUserId(@PathVariable String userId) {
        List<EventDto> events = eventService.getEventsByUserId(userId);
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/git-session/{gitSessionId}")
    public ResponseEntity<List<EventDto>> getEventsByGitSessionId(@PathVariable String gitSessionId) {
        List<EventDto> events = eventService.getEventsByGitSessionId(gitSessionId);
        return ResponseEntity.ok(events);
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<EventDto>> getEventsByType(@PathVariable String type) {
        List<EventDto> events = eventService.getEventsByType(type);
        return ResponseEntity.ok(events);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<EventDto> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody UpdateEventRequest request) {
        EventDto event = eventService.updateEvent(id, request);
        return ResponseEntity.ok(event);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteEvent(@PathVariable String id) {
        eventService.deleteEvent(id);
        ApiResponse response = new ApiResponse(true, "Event deleted successfully");
        return ResponseEntity.ok(response);
    }
}

