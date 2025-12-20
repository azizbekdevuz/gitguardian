package com.scoop.hackathon.service;

import com.scoop.hackathon.dto.CreateEventRequest;
import com.scoop.hackathon.dto.EventDto;
import com.scoop.hackathon.dto.UpdateEventRequest;
import com.scoop.hackathon.entity.Event;
import com.scoop.hackathon.exception.ResourceNotFoundException;
import com.scoop.hackathon.repository.EventRepository;
import com.scoop.hackathon.util.CuidGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventServiceImpl implements EventService {
    
    private final EventRepository eventRepository;
    
    public EventServiceImpl(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }
    
    @Override
    public EventDto createEvent(CreateEventRequest request) {
        Event event = new Event();
        event.setId(CuidGenerator.generate());
        event.setType(request.getType());
        event.setUserId(request.getUserId());
        event.setGitSessionId(request.getGitSessionId());
        event.setMetadata(request.getMetadata());
        
        Event savedEvent = eventRepository.save(event);
        return convertToDto(savedEvent);
    }
    
    @Override
    @Transactional(readOnly = true)
    public EventDto getEventById(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        return convertToDto(event);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getEventsByUserId(String userId) {
        return eventRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getEventsByGitSessionId(String gitSessionId) {
        return eventRepository.findByGitSessionId(gitSessionId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<EventDto> getEventsByType(String type) {
        return eventRepository.findByType(type).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Override
    public EventDto updateEvent(String id, UpdateEventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        
        if (request.getType() != null) event.setType(request.getType());
        if (request.getUserId() != null) event.setUserId(request.getUserId());
        if (request.getGitSessionId() != null) event.setGitSessionId(request.getGitSessionId());
        if (request.getMetadata() != null) event.setMetadata(request.getMetadata());
        
        Event updatedEvent = eventRepository.save(event);
        return convertToDto(updatedEvent);
    }
    
    @Override
    public void deleteEvent(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
        eventRepository.delete(event);
    }
    
    private EventDto convertToDto(Event event) {
        EventDto dto = new EventDto();
        dto.setId(event.getId());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setType(event.getType());
        dto.setUserId(event.getUserId());
        dto.setGitSessionId(event.getGitSessionId());
        dto.setMetadata(event.getMetadata());
        return dto;
    }
}

