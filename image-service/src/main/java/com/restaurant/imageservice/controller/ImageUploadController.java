package com.restaurant.imageservice.controller;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
public class ImageUploadController {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_CATEGORIES = Set.of("foods", "users", "temp");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");

    // Ngăn path traversal: chỉ cho phép tên file thuần (không có / \ ..)
    private String sanitizeFilename(String filename) {
        if (filename == null) return null;
        // Chỉ lấy phần cuối sau dấu / hoặc \
        String base = Paths.get(filename).getFileName().toString();
        // Từ chối nếu vẫn còn .. hoặc ký tự nguy hiểm
        if (base.contains("..") || base.isBlank()) return null;
        return base;
    }

    // Kiểm tra path nằm trong thư mục cha
    private boolean isWithinUploadDir(Path resolved) {
        try {
            Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path target = resolved.toAbsolutePath().normalize();
            return target.startsWith(base);
        } catch (Exception e) {
            return false;
        }
    }

    // ============== SERVE IMAGE (GET) ==============
    @GetMapping("/{category}/{filename}")
    public ResponseEntity<Resource> serveImage(@PathVariable String category, @PathVariable String filename) {
        // BUG-NEW-001: Chặn path traversal
        if (!ALLOWED_CATEGORIES.contains(category)) {
            return ResponseEntity.badRequest().build();
        }
        String safeFilename = sanitizeFilename(filename);
        if (safeFilename == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Path filePath = Paths.get(uploadDir, category, safeFilename);
            if (!isWithinUploadDir(filePath)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            File file = filePath.toFile();
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";
            // Chỉ phục vụ file ảnh
            if (!contentType.startsWith("image/")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============== UPLOAD APIs ==============
    @PostMapping("/upload/foods")
    public ResponseEntity<Map<String, String>> uploadFoodImage(@RequestParam("image") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không có file được tải lên"));
        }

        String filename = saveAndResizeImage(file, "foods", 800);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", "/api/images/foods/" + filename));
    }

    @PostMapping("/upload/users")
    public ResponseEntity<Map<String, String>> uploadUserImage(@RequestParam("image") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không có file được tải lên"));
        }

        String filename = saveAndResizeImage(file, "users", 400);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", "/api/images/users/" + filename));
    }

    @DeleteMapping("/foods/{filename}")
    public ResponseEntity<Map<String, String>> deleteFoodImage(@PathVariable String filename) {
        return deleteImage(filename, "foods");
    }

    @DeleteMapping("/users/{filename}")
    public ResponseEntity<Map<String, String>> deleteUserImage(@PathVariable String filename) {
        return deleteImage(filename, "users");
    }

    // ============== PRIVATE HELPERS ==============
    private String saveAndResizeImage(MultipartFile file, String subDir, int targetWidth) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }
        // BUG-NEW-001: Validate extension — chặn upload file nguy hiểm
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IOException("Loại file không được phép. Chỉ chấp nhận: jpg, jpeg, png, gif, webp");
        }

        String uniqueFilename = UUID.randomUUID().toString() + extension;

        Path targetPath = Paths.get(uploadDir, subDir);
        if (!Files.exists(targetPath)) {
            Files.createDirectories(targetPath);
        }

        File destFile = targetPath.resolve(uniqueFilename).toFile();
        if (!isWithinUploadDir(destFile.toPath())) {
            throw new IOException("Đường dẫn file không hợp lệ");
        }

        Thumbnails.of(file.getInputStream())
                .width(targetWidth)
                .outputQuality(0.8)
                .toFile(destFile);

        return uniqueFilename;
    }

    private ResponseEntity<Map<String, String>> deleteImage(String filename, String subDir) {
        // BUG-NEW-001: Chặn path traversal trong delete
        String safeFilename = sanitizeFilename(filename);
        if (safeFilename == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên file không hợp lệ"));
        }
        Path filePath = Paths.get(uploadDir, subDir, safeFilename);
        if (!isWithinUploadDir(filePath)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Đường dẫn không hợp lệ"));
        }
        File file = filePath.toFile();
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy hình ảnh"));
        }
        if (file.delete()) {
            return ResponseEntity.ok(Map.of("message", "Xóa hình ảnh thành công"));
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Không thể xóa hình ảnh"));
    }
}
