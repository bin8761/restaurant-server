// URL của API Gateway — tự detect theo hostname hiện tại
// BUG-026: Không hardcode localhost:3000 để có thể deploy lên server khác
const API_BASE = window.location.protocol + '//' + window.location.hostname + ':3000';
