const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE_URL = configuredBase.replace(/\/+$/, '');
const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function getSourceItems(raw) {
  if (Array.isArray(raw)) return raw;
  const item = asObject(raw);
  if (Array.isArray(item.chunks)) return item.chunks;
  if (Array.isArray(item.references)) return item.references;
  if (Array.isArray(item.sources)) return item.sources;
  if (Array.isArray(item.doc_aggs)) return item.doc_aggs;
  if (Array.isArray(item.data?.chunks)) return item.data.chunks;
  if (Array.isArray(item.data?.references)) return item.data.references;
  if (Array.isArray(item.reference?.chunks)) return item.reference.chunks;
  return [];
}

function extractHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const match = value.match(/https?:\/\/[^\s<>'"\])}]+/i);
  if (!match) return '';
  const candidate = match[0].replace(/[.,;!?]+$/, '');
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function firstUrl(...values) {
  for (const value of values) {
    const url = extractHttpUrl(typeof value === 'string' ? value : '');
    if (url) return url;
  }
  return '';
}

function normalizeSource(raw, index) {
  const item = asObject(raw);
  const metadata = asObject(item.metadata || item.meta || item.document_metadata || item.doc_metadata);
  const content = String(
    item.content_with_weight || item.content || item.text || item.excerpt || item.chunk_content || ''
  );
  const statusText = [
    item.verification_status,
    item.status,
    item.audit_status,
    item.scrape_status,
    metadata['Audit Status'],
    metadata['Scrape Status'],
    metadata['Verification Note'],
    metadata['Status Verifikasi'],
    item.verification_note,
    content,
  ].filter(Boolean).join(' ');
  const unverified = /BELUM TERVERIFIKASI|NEED[_ -]?REVIEW|PARTIAL|PERLU DITINJAU|UNVERIFIED|OUT_OF_SCOPE/i.test(statusText);

  const url = firstUrl(
    item.url,
    item.source_url,
    item.sourceUrl,
    item.link,
    item.source,
    metadata.url,
    metadata.link,
    metadata.Link,
    metadata.source_url,
    metadata['Source Detail URL'],
    metadata['Sumber resmi'],
    metadata['Link Layanan'],
    content,
  );
  const title = String(
    item.title ||
    metadata['Layanan'] || metadata.layanan || metadata.service_name ||
    item.doc_name || item.document_name || item.name ||
    (url ? 'Buka sumber layanan' : 'Dokumen sumber Laras')
  );

  const verificationStatus = String(
    item.verification_status || item.audit_status || item.scrape_status ||
    metadata['Audit Status'] || metadata['Scrape Status'] ||
    metadata['Status Verifikasi'] ||
    (unverified ? 'Belum terverifikasi / perlu ditinjau' : 'Periksa status pada data sumber')
  );

  return {
    id: item.id || item.chunk_id || `${index}-${item.doc_id || item.doc_name || 'source'}`,
    title,
    url,
    excerpt: content,
    verificationStatus,
    unverified,
  };
}

export async function sendLarasMessage({ question, sessionId = '', category = '' }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 210_000);

  let response;
  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        session_id: sessionId || undefined,
        category: category || undefined,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Permintaan terlalu lama. Periksa apakah backend Golang, RAGFlow, dan Ollama masih berjalan, lalu coba lagi.');
    }
    throw new Error('Tidak dapat terhubung ke backend Laras. Pastikan backend Golang aktif dan Vite diarahkan ke alamat yang benar.');
  } finally {
    clearTimeout(timeout);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Permintaan gagal (HTTP ${response.status})`);
  }

  const answer = payload.answer || payload.data?.answer || payload.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('Backend tidak mengembalikan teks jawaban. Periksa format respons RAGFlow di backend Golang.');
  }

  const rawSources = payload.sources ?? payload.reference ?? payload.data?.reference ?? payload.choices?.[0]?.message?.reference;
  const sources = getSourceItems(rawSources).map(normalizeSource).filter((source) => source.url || source.title || source.excerpt).slice(0, 6);

  return {
    answer,
    sessionId: payload.session_id || payload.sessionId || sessionId || '',
    sources,
  };
}
