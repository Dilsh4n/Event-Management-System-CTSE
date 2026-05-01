package com.ctse.notificationservice.service;

import com.ctse.notificationservice.dto.CreateNotificationRequest;
import com.ctse.notificationservice.dto.EventMirrorResponse;
import com.ctse.notificationservice.dto.NotificationResponse;
import com.ctse.notificationservice.dto.UserMirrorResponse;
import com.ctse.notificationservice.model.Notification;
import com.ctse.notificationservice.model.NotificationType;
import com.ctse.notificationservice.repository.NotificationRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * NotificationService
 * ===================
 * Builds personalised notification messages from templates and persists them.
 *
 * NOTIFICATION TEMPLATES (plain-text fallback + HTML email):
 * ────────────────────────────────────────────────────────────
 * WELCOME                — account created confirmation
 * NEW_EVENT              — new event available to register for
 * REGISTRATION_CONFIRMED — registration confirmed for a specific event
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a");

    private final NotificationRepository notificationRepository;
    private final RestTemplate restTemplate;
    private final JavaMailSender mailSender;

    @Value("${app.services.user-url}")
    private String userServiceUrl;

    @Value("${app.services.event-url}")
    private String eventServiceUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public NotificationResponse createNotification(CreateNotificationRequest request) {
        UserMirrorResponse user = fetchUser(request.getUserId());
        String message = buildMessage(request, user);

        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .eventId(request.getEventId())
                .message(message)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Saved {} notification for user {}", request.getType(), request.getUserId());

        sendHtmlEmail(user, request, message);

        return toResponse(saved);
    }

    public List<NotificationResponse> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Plain-text message builder ─────────────────────────────────────────

    private String buildMessage(CreateNotificationRequest request, UserMirrorResponse user) {
        NotificationType type;
        try {
            type = NotificationType.valueOf(request.getType());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown notification type '{}', using fallback", request.getType());
            return "You have a new notification.";
        }

        return switch (type) {
            case WELCOME -> String.format(
                    "Welcome to the University Tech Conference Platform, %s! " +
                    "Your account has been successfully created.",
                    user.getName()
            );
            case NEW_EVENT -> {
                EventMirrorResponse event = fetchEvent(request.getEventId());
                yield String.format(
                    "Hi %s, a new event has been scheduled: '%s' at %s on %s. Register now!",
                    user.getName(), event.getTitle(), event.getLocation(),
                    event.getDate() != null ? event.getDate().toLocalDate() : "TBD"
                );
            }
            case REGISTRATION_CONFIRMED -> {
                EventMirrorResponse event = fetchEvent(request.getEventId());
                yield String.format(
                    "Hi %s, you have successfully registered for '%s' at %s on %s.",
                    user.getName(), event.getTitle(), event.getLocation(),
                    event.getDate() != null ? event.getDate().toLocalDate() : "TBD"
                );
            }
        };
    }

    // ── HTML email sending ─────────────────────────────────────────────────

    private void sendHtmlEmail(UserMirrorResponse user, CreateNotificationRequest request, String plainText) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.warn("Cannot send email for user {} — no email address", user.getId());
            return;
        }

        try {
            String subject;
            String htmlBody;

            switch (request.getType()) {
                case "WELCOME" -> {
                    subject  = "🎓 Welcome to UniEvents!";
                    htmlBody = buildWelcomeEmail(user.getName());
                }
                case "NEW_EVENT" -> {
                    EventMirrorResponse event = fetchEvent(request.getEventId());
                    subject  = "🎉 New Event: " + event.getTitle();
                    htmlBody = buildNewEventEmail(user.getName(), event);
                }
                case "REGISTRATION_CONFIRMED" -> {
                    EventMirrorResponse event = fetchEvent(request.getEventId());
                    subject  = "✅ Registration Confirmed: " + event.getTitle();
                    htmlBody = buildRegistrationEmail(user.getName(), event);
                }
                default -> {
                    subject  = "📢 Notification — UniEvents";
                    htmlBody = buildGenericEmail(user.getName(), plainText);
                }
            }

            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(plainText, htmlBody);
            mailSender.send(mime);
            log.info("HTML email sent to {} for {} notification", user.getEmail(), request.getType());

        } catch (Exception e) {
            log.warn("Failed to send email to {} (non-critical): {}", user.getEmail(), e.getMessage());
        }
    }

    // ── HTML template builders ─────────────────────────────────────────────

    private String buildWelcomeEmail(String name) {
        return wrapInLayout(
            "Welcome to UniEvents! 🎓",
            "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            "🎓",
            String.format("""
                <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 12px;">
                  Hello, %s! 👋
                </h2>
                <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
                  Your account has been successfully created on the
                  <strong>University Tech Conference Platform</strong>.
                  You now have access to all upcoming university events, workshops, and tech conferences.
                </p>

                <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                  <tr>
                    <td style="width:33%%;padding:14px 10px;background:#f5f7ff;border-radius:10px;text-align:center;">
                      <div style="font-size:30px;margin-bottom:8px;">📅</div>
                      <div style="font-size:13px;font-weight:700;color:#374151;">Browse Events</div>
                      <div style="font-size:12px;color:#9ca3af;margin-top:3px;">Discover workshops &amp; talks</div>
                    </td>
                    <td width="10"></td>
                    <td style="width:33%%;padding:14px 10px;background:#f0fdf4;border-radius:10px;text-align:center;">
                      <div style="font-size:30px;margin-bottom:8px;">✅</div>
                      <div style="font-size:13px;font-weight:700;color:#374151;">Easy Registration</div>
                      <div style="font-size:12px;color:#9ca3af;margin-top:3px;">Sign up in one click</div>
                    </td>
                    <td width="10"></td>
                    <td style="width:33%%;padding:14px 10px;background:#fef3c7;border-radius:10px;text-align:center;">
                      <div style="font-size:30px;margin-bottom:8px;">🔔</div>
                      <div style="font-size:13px;font-weight:700;color:#374151;">Stay Notified</div>
                      <div style="font-size:12px;color:#9ca3af;margin-top:3px;">Never miss an event</div>
                    </td>
                  </tr>
                </table>

                <div style="text-align:center;">
                  <a href="#" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);
                    color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;
                    text-decoration:none;box-shadow:0 4px 14px rgba(99,102,241,0.3);">
                    Browse Events &rarr;
                  </a>
                </div>
                """, escapeHtml(name))
        );
    }

    private String buildNewEventEmail(String name, EventMirrorResponse event) {
        String dateStr = event.getDate() != null
                ? event.getDate().format(DATE_FMT) : "TBD";
        String location = event.getLocation() != null ? escapeHtml(event.getLocation()) : "TBA";

        return wrapInLayout(
            "New Event Available",
            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            "🎉",
            String.format("""
                <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 12px;">
                  Hi %s, there's a new event! 🎉
                </h2>
                <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
                  A new event has been scheduled on the platform. Don't miss out — spots are limited!
                </p>

                <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:24px;margin-bottom:24px;">
                  <h3 style="color:#92400e;font-size:20px;font-weight:800;margin:0 0 16px;">
                    📅 %s
                  </h3>
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="display:inline-block;width:22px;text-align:center;">🗓️</span>
                        <span style="color:#78350f;font-size:14px;font-weight:600;">%s</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="display:inline-block;width:22px;text-align:center;">📍</span>
                        <span style="color:#78350f;font-size:14px;font-weight:600;">%s</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="text-align:center;">
                  <a href="#" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);
                    color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;
                    text-decoration:none;box-shadow:0 4px 14px rgba(245,158,11,0.35);">
                    Register Now &rarr;
                  </a>
                </div>
                """,
                escapeHtml(name),
                escapeHtml(event.getTitle()),
                dateStr,
                location)
        );
    }

    private String buildRegistrationEmail(String name, EventMirrorResponse event) {
        String dateStr = event.getDate() != null
                ? event.getDate().format(DATE_FMT) : "TBD";
        String location = event.getLocation() != null ? escapeHtml(event.getLocation()) : "TBA";

        return wrapInLayout(
            "Registration Confirmed",
            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            "✅",
            String.format("""
                <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 12px;">
                  You're registered, %s! 🎊
                </h2>
                <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
                  Great news — your spot has been confirmed. We look forward to seeing you there!
                </p>

                <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                    <div style="width:10px;height:10px;border-radius:50%%;background:#10b981;"></div>
                    <span style="font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.5px;">Registration Confirmed</span>
                  </div>
                  <h3 style="color:#065f46;font-size:20px;font-weight:800;margin:0 0 16px;">
                    %s
                  </h3>
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="display:inline-block;width:22px;text-align:center;">🗓️</span>
                        <span style="color:#065f46;font-size:14px;font-weight:600;">%s</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;">
                        <span style="display:inline-block;width:22px;text-align:center;">📍</span>
                        <span style="color:#065f46;font-size:14px;font-weight:600;">%s</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="background:#fffbeb;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#92400e;">
                  💡 <strong>Tip:</strong> Add this event to your calendar and arrive a few minutes early.
                </div>

                <div style="text-align:center;">
                  <a href="#" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);
                    color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;
                    text-decoration:none;box-shadow:0 4px 14px rgba(16,185,129,0.35);">
                    View My Registrations &rarr;
                  </a>
                </div>
                """,
                escapeHtml(name),
                escapeHtml(event.getTitle()),
                dateStr,
                location)
        );
    }

    private String buildGenericEmail(String name, String message) {
        return wrapInLayout(
            "You have a new notification",
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            "🔔",
            String.format("""
                <h2 style="color:#111827;font-size:22px;font-weight:800;margin:0 0 16px;">
                  Hi %s
                </h2>
                <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
                  %s
                </p>
                """, escapeHtml(name), escapeHtml(message))
        );
    }

    // ── Layout wrapper ─────────────────────────────────────────────────────

    private String wrapInLayout(String headerTitle, String gradient, String emoji, String body) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin:0;padding:0;background:#f3f4f8;
              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:40px 20px;">
                    <table width="600" cellpadding="0" cellspacing="0"
                      style="max-width:600px;width:100%%;">

                      <!-- Header -->
                      <tr>
                        <td style="background:%s;border-radius:16px 16px 0 0;
                          padding:40px 40px 32px;text-align:center;">
                          <div style="font-size:52px;margin-bottom:14px;">%s</div>
                          <h1 style="color:white;font-size:24px;font-weight:800;
                            margin:0 0 6px;letter-spacing:-0.5px;">%s</h1>
                          <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0;">
                            University Tech Conference Platform
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="background:white;padding:36px 40px;">
                          %s
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#f9fafb;border-radius:0 0 16px 16px;
                          padding:20px 40px;text-align:center;
                          border-top:1px solid #e5e7eb;">
                          <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">
                            &copy; 2025 University Tech Conference Platform. All rights reserved.
                          </p>
                          <p style="color:#9ca3af;font-size:12px;margin:0;">
                            This is an automated message — please do not reply.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """, headerTitle, gradient, emoji, headerTitle, body);
    }

    // ── Inter-service helpers ──────────────────────────────────────────────

    private UserMirrorResponse fetchUser(String userId) {
        String url = userServiceUrl + "/users/" + userId;
        try {
            UserMirrorResponse user = restTemplate.getForObject(url, UserMirrorResponse.class);
            return user != null ? user : fallbackUser();
        } catch (RestClientException e) {
            log.warn("Could not fetch user {} from User Service: {}", userId, e.getMessage());
            return fallbackUser();
        }
    }

    private EventMirrorResponse fetchEvent(String eventId) {
        if (eventId == null || eventId.isBlank()) return fallbackEvent();
        String url = eventServiceUrl + "/events/" + eventId;
        try {
            EventMirrorResponse event = restTemplate.getForObject(url, EventMirrorResponse.class);
            return event != null ? event : fallbackEvent();
        } catch (RestClientException e) {
            log.warn("Could not fetch event {} from Event Service: {}", eventId, e.getMessage());
            return fallbackEvent();
        }
    }

    private UserMirrorResponse  fallbackUser()  { return new UserMirrorResponse(null, "User", null); }
    private EventMirrorResponse fallbackEvent() { return new EventMirrorResponse(null, "Unknown Event", "TBA", LocalDateTime.now()); }

    // ── Mapper ─────────────────────────────────────────────────────────────

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .type(n.getType())
                .message(n.getMessage())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
