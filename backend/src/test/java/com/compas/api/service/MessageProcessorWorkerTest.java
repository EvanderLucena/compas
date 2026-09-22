package com.compas.api.service;

import com.compas.api.model.WhatsAppMessage;
import com.compas.api.repository.WhatsAppMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageProcessorWorkerTest {

    @Mock MessageQueueService messageQueueService;
    @Mock ConversationService conversationService;
    @Mock WhatsAppMessageRepository whatsAppMessageRepository;

    private MessageProcessorWorker worker;

    private UUID messageId;
    private WhatsAppMessage message;

    @BeforeEach
    void setup() {
        messageId = UUID.randomUUID();
        message = WhatsAppMessage.builder()
                .id(messageId)
                .messageId("msg-" + messageId)
                .retryCount(0)
                .build();

        worker = new MessageProcessorWorker(
                messageQueueService,
                conversationService,
                whatsAppMessageRepository,
                Runnable::run,
                5
        );
    }

    @Test
    void processNextMessage_dequeuesAndDelegates() {
        when(messageQueueService.dequeue()).thenReturn(Optional.of(messageId), Optional.empty());
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(message));

        worker.processNextMessage();

        verify(messageQueueService, times(2)).dequeue();
        verify(conversationService).processMessage(messageId);
    }

    @Test
    void processNextMessage_multipleMessages_processesUpToLimit() {
        UUID id2 = UUID.randomUUID();
        WhatsAppMessage msg2 = WhatsAppMessage.builder().id(id2).messageId("msg-2").retryCount(0).build();

        when(messageQueueService.dequeue()).thenReturn(Optional.of(messageId), Optional.of(id2), Optional.empty());
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(message));
        when(whatsAppMessageRepository.findById(id2)).thenReturn(Optional.of(msg2));

        worker.processNextMessage();

        verify(conversationService).processMessage(messageId);
        verify(conversationService).processMessage(id2);
    }

    @Test
    void processNextMessage_emptyQueue_doesNothing() {
        when(messageQueueService.dequeue()).thenReturn(Optional.empty());

        worker.processNextMessage();

        verify(messageQueueService).dequeue();
        verify(conversationService, never()).processMessage(any());
    }

    @Test
    void processNextMessage_processingError_logsAndContinues() {
        when(messageQueueService.dequeue()).thenReturn(Optional.of(messageId), Optional.empty());
        when(whatsAppMessageRepository.findById(messageId)).thenReturn(Optional.of(message));
        doThrow(new RuntimeException("Processing failed")).when(conversationService).processMessage(messageId);

        // Should not throw even though processing failed
        assertDoesNotThrow(() -> worker.processNextMessage());

        verify(messageQueueService, times(2)).dequeue();
        verify(conversationService).processMessage(messageId);
        verify(whatsAppMessageRepository).save(argThat(m -> m.getRetryCount() == 1));
    }
}
