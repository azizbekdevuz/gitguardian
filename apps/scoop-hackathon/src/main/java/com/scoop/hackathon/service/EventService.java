package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateEventRequest;
import com.scoop.hackathon.dto.EventDto;
import com.scoop.hackathon.dto.UpdateEventRequest;

import java.util.List;

public interface EventService {
    EventDto createEvent(CreateEventRequest request);
    EventDto getEventById(String id);
    List<EventDto> getAllEvents();
    List<EventDto> getEventsByUserId(String userId);
    List<EventDto> getEventsByGitSessionId(String gitSessionId);
    List<EventDto> getEventsByType(String type);
    EventDto updateEvent(String id, UpdateEventRequest request);
    void deleteEvent(String id);
}

