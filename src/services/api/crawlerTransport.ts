export async function requestCrawler<T>(baseUrl: string, endpoint: string, options: RequestInit = {}, timeoutMs = 25000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      if ([502, 503, 504].includes(response.status)) {
        throw new Error(`Dịch vụ thu thập tạm thời không kết nối được (HTTP ${response.status}). Vui lòng kiểm tra máy chủ crawler và cấu hình proxy.`);
      }
      const detail = body?.detail || body?.error;
      throw new Error(typeof detail === 'string' ? detail : `Yêu cầu thu thập thất bại (HTTP ${response.status}).`);
    }
    if (!body || typeof body !== 'object') throw new Error('Máy chủ thu thập trả về dữ liệu không hợp lệ. Kiểm tra cấu hình đường dẫn crawler.');
    return body as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Hết thời gian chờ dịch vụ thu thập. Kiểm tra tiến trình trước khi gửi lại để tránh cào trùng.');
    throw error;
  } finally { clearTimeout(timeout); }
}
