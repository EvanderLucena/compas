package com.nutriai.api.dto.whatsapp;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for incoming Evolution API (Go) webhook payloads.
 * Schema matches both camelCase and PascalCase formats emitted by Evolution Go:
 * {"event": "Message", "data": {...}, "instanceId": "...", "instanceToken": "..."}
 *
 * Uses ignoreUnknown and JsonAlias for resilience against field casing and schema changes.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class WhatsAppWebhookDTO {

    @JsonAlias({"event", "Event"})
    private String event;

    @JsonAlias({"data", "Data"})
    private MessageData data;

    @JsonAlias({"instanceId", "InstanceId", "instance_id", "InstanceID"})
    private String instanceId;

    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public MessageData getData() { return data; }
    public void setData(MessageData data) { this.data = data; }
    public String getInstanceId() { return instanceId; }
    public void setInstanceId(String instanceId) { this.instanceId = instanceId; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MessageData {
        @JsonAlias({"info", "Info"})
        private WhatsAppInfo info;

        @JsonAlias({"message", "Message"})
        private MessageContent message;

        public WhatsAppInfo getInfo() { return info; }
        public void setInfo(WhatsAppInfo info) { this.info = info; }
        public MessageContent getMessage() { return message; }
        public void setMessage(MessageContent message) { this.message = message; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WhatsAppInfo {
        @JsonAlias({"chat", "Chat"})
        private String chat;

        @JsonAlias({"sender", "Sender"})
        private String sender;

        @JsonAlias({"senderAlt", "SenderAlt", "sender_alt"})
        private String senderAlt;

        @JsonProperty("isFromMe")
        @JsonAlias({"isFromMe", "IsFromMe", "fromMe", "FromMe"})
        private boolean isFromMe;

        @JsonProperty("isGroup")
        @JsonAlias({"isGroup", "IsGroup"})
        private boolean isGroup;

        @JsonAlias({"id", "Id", "ID"})
        private String id;

        @JsonAlias({"type", "Type"})
        private String type;

        @JsonAlias({"pushName", "PushName", "push_name"})
        private String pushName;

        @JsonAlias({"timestamp", "Timestamp"})
        private String timestamp;

        @JsonAlias({"mediaType", "MediaType", "media_type"})
        private String mediaType;

        @JsonProperty("isFromMe")
        public boolean isFromMe() { return isFromMe; }
        public void setFromMe(boolean fromMe) { isFromMe = fromMe; }

        @JsonProperty("isGroup")
        public boolean isGroup() { return isGroup; }
        public void setGroup(boolean group) { isGroup = group; }

        public String getChat() { return chat; }
        public void setChat(String chat) { this.chat = chat; }
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getSenderAlt() { return senderAlt; }
        public void setSenderAlt(String senderAlt) { this.senderAlt = senderAlt; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getPushName() { return pushName; }
        public void setPushName(String pushName) { this.pushName = pushName; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        public String getMediaType() { return mediaType; }
        public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MessageContent {
        @JsonAlias({"conversation", "Conversation"})
        private String conversation;

        @JsonAlias({"extendedTextMessage", "ExtendedTextMessage", "extended_text_message"})
        private ExtendedTextMessage extendedTextMessage;

        @JsonAlias({"imageMessage", "ImageMessage", "image_message"})
        private ImageMessage imageMessage;

        @JsonAlias({"audioMessage", "AudioMessage", "audio_message"})
        private AudioMessage audioMessage;

        public String getConversation() { return conversation; }
        public void setConversation(String conversation) { this.conversation = conversation; }
        public ExtendedTextMessage getExtendedTextMessage() { return extendedTextMessage; }
        public void setExtendedTextMessage(ExtendedTextMessage extendedTextMessage) {
            this.extendedTextMessage = extendedTextMessage;
        }
        public ImageMessage getImageMessage() { return imageMessage; }
        public void setImageMessage(ImageMessage imageMessage) { this.imageMessage = imageMessage; }
        public AudioMessage getAudioMessage() { return audioMessage; }
        public void setAudioMessage(AudioMessage audioMessage) { this.audioMessage = audioMessage; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExtendedTextMessage {
        @JsonAlias({"text", "Text"})
        private String text;

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ImageMessage {
        @JsonAlias({"caption", "Caption"})
        private String caption;

        @JsonAlias({"url", "Url", "URL"})
        private String url;

        @JsonAlias({"base64", "Base64"})
        private String base64;

        @JsonAlias({"mimetype", "Mimetype", "mimeType", "MimeType"})
        private String mimeType;

        @JsonAlias({"directPath", "DirectPath"})
        private String directPath;

        @JsonAlias({"mediaKey", "MediaKey"})
        private String mediaKey;

        @JsonAlias({"fileEncSHA256", "fileEncSha256"})
        private String fileEncSHA256;

        @JsonAlias({"fileSHA256", "fileSha256"})
        private String fileSHA256;

        @JsonAlias({"fileLength", "FileLength"})
        private Long fileLength;

        public String getCaption() { return caption; }
        public void setCaption(String caption) { this.caption = caption; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getBase64() { return base64; }
        public void setBase64(String base64) { this.base64 = base64; }
        public String getMimeType() { return mimeType; }
        public void setMimeType(String mimeType) { this.mimeType = mimeType; }
        public String getDirectPath() { return directPath; }
        public void setDirectPath(String directPath) { this.directPath = directPath; }
        public String getMediaKey() { return mediaKey; }
        public void setMediaKey(String mediaKey) { this.mediaKey = mediaKey; }
        public String getFileEncSHA256() { return fileEncSHA256; }
        public void setFileEncSHA256(String fileEncSHA256) { this.fileEncSHA256 = fileEncSHA256; }
        public String getFileSHA256() { return fileSHA256; }
        public void setFileSHA256(String fileSHA256) { this.fileSHA256 = fileSHA256; }
        public Long getFileLength() { return fileLength; }
        public void setFileLength(Long fileLength) { this.fileLength = fileLength; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AudioMessage {
        @JsonAlias({"url", "Url", "URL"})
        private String url;

        @JsonAlias({"base64", "Base64"})
        private String base64;

        @JsonAlias({"mimetype", "Mimetype", "mimeType", "MimeType"})
        private String mimeType;

        @JsonAlias({"directPath", "DirectPath"})
        private String directPath;

        @JsonAlias({"mediaKey", "MediaKey"})
        private String mediaKey;

        @JsonAlias({"fileEncSHA256", "fileEncSha256"})
        private String fileEncSHA256;

        @JsonAlias({"fileSHA256", "fileSha256"})
        private String fileSHA256;

        @JsonAlias({"fileLength", "FileLength"})
        private Long fileLength;

        @JsonAlias({"seconds", "Seconds"})
        private Integer seconds;

        @JsonProperty("PTT")
        @JsonAlias({"ptt", "PTT", "Ptt"})
        private Boolean ptt;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getBase64() { return base64; }
        public void setBase64(String base64) { this.base64 = base64; }
        public String getMimeType() { return mimeType; }
        public void setMimeType(String mimeType) { this.mimeType = mimeType; }
        public String getDirectPath() { return directPath; }
        public void setDirectPath(String directPath) { this.directPath = directPath; }
        public String getMediaKey() { return mediaKey; }
        public void setMediaKey(String mediaKey) { this.mediaKey = mediaKey; }
        public String getFileEncSHA256() { return fileEncSHA256; }
        public void setFileEncSHA256(String fileEncSHA256) { this.fileEncSHA256 = fileEncSHA256; }
        public String getFileSHA256() { return fileSHA256; }
        public void setFileSHA256(String fileSHA256) { this.fileSHA256 = fileSHA256; }
        public Long getFileLength() { return fileLength; }
        public void setFileLength(Long fileLength) { this.fileLength = fileLength; }
        public Integer getSeconds() { return seconds; }
        public void setSeconds(Integer seconds) { this.seconds = seconds; }
        public Boolean getPtt() { return ptt; }
        public void setPtt(Boolean ptt) { this.ptt = ptt; }
    }
}
