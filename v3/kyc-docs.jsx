/* KYC case › Documents: row actions, checklist evidence links, document viewer + states.
   Mirrors "KYC Document Viewer.html". Response state is driven by the "Document response" tweak. */
const DOC_LABEL = d => d.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const PERSON_DOCS = /passport|liveness|settlor_id|tax_self_cert|source_of_wealth/;
const maskName = n => n.split(' ').map(x => x[0] + '.').join(' ');
const PREVIEWABLE = m => /^(application\/pdf|image\/(jpeg|png))$/.test(m);
const fmtSize = kb => kb >= 1000 ? (kb / 1000).toFixed(1) + ' MB' : kb + ' KB';

function kycDocRows(o) {
  const ubo = o.people.find(p => /ubo|account_holder|settlor/.test(p.role)) || o.people[0];
  const sof = o.people.find(p => p.role === 'ubo' && p !== ubo) || ubo;
  return o.docs.map((d, k) => {
    const has_file = d.status !== 'missing';
    const mime = d.doc_type === 'board_resolution' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : d.mime;
    const person = PERSON_DOCS.test(d.doc_type) ? ubo : /source_of_funds/.test(d.doc_type) && o.type !== 'individual' ? sof : null;
    return { ...d, id: d.doc_type, ref: 'D-' + String(o.id * 10 + k + 40).padStart(4, '0'), mime, has_file,
      previewable: has_file && PREVIEWABLE(mime), page_count: /pdf/.test(mime) ? 1 + ((o.id + k) % 4) : null,
      person, person_masked: person ? maskName(person.name) : null,
      uploaded_at: has_file ? (d.issued_at || o.submitted_at || '2026-10-19') : null,
      sha: (((o.id + 3) * 2654435761 + (k + 1) * 40503) >>> 0).toString(16).padStart(8, 'a') };
  });
}
const fileLabel = d => !d.has_file ? 'no file' : `${/pdf/.test(d.mime) ? 'PDF' : /word/.test(d.mime) ? 'DOCX' : d.mime.split('/')[1].toUpperCase()}${d.page_count ? ` · ${d.page_count} p${d.page_count > 1 ? 'p' : ''}` : ''} · ${fmtSize(d.size_kb)}`;

/* checklist item → evidence doc types */
const EVIDENCE = {
  'Entity verification0': /certificate_of_incorporation|certificate_of_registration|trust_deed|articles/,
  'Entity verification1': /proof_of_address/,
  'Entity verification2': /register_of_directors|register_of_trustees|board_resolution/,
  'Entity verification3': /ubo_register/,
  'People0': /passport|liveness|settlor_id|proof_of_address/,
  'Source of funds0': /source_of_funds|source_of_wealth/,
};
const evidenceFor = (key, rows) => EVIDENCE[key] ? rows.filter(r => EVIDENCE[key].test(r.doc_type)) : null;
const itemsFor = (ref, rows, SECT) => SECT.flatMap(([s, it]) => it.map((x, i) => ({ key: s + i, text: x }))).filter(c => (evidenceFor(c.key, rows) || []).some(r => r.ref === ref));

function DocActions({ d, access, limited, onOpen, onDownload }) {
  if (!access) return <span className="kdoc-lock" title="Opening KYC documents needs the KYC approve role. Ask an admin under Admin › Roles.">🔒 Restricted</span>;
  const nofile = !d.has_file ? 'No file uploaded yet' : null;
  const lim = limited ? 'Download limit reached for this hour. Try again in 23 min.' : null;
  return <span className="kdoc-acts">
    <PmsButton sm reason={nofile || (!d.previewable ? "This file type can't be previewed. Download it to view." : lim)} onClick={() => onOpen(d.ref)}>Open</PmsButton>
    <PmsButton sm variant="ghost" reason={nofile || lim} onClick={() => onDownload(d.ref)}>Download</PmsButton>
  </span>;
}

function EvidenceLink({ refs, access, onOpen }) {
  if (refs === null) return <span className="kdoc-ev muted">no document needed</span>;
  if (!access) return null;
  const withFile = refs.filter(r => r.has_file);
  if (!withFile.length) return <span className="kdoc-ev muted" title="Requested from the client · no file uploaded yet">No document yet</span>;
  return <a className="kdoc-ev" onClick={e => { e.preventDefault(); onOpen(withFile[0].ref, withFile.map(r => r.ref)); }}>{withFile.length > 1 ? `View ${withFile.length} documents ›` : 'View document ›'}</a>;
}

function DocPaper({ d, page, zoom, rot }) {
  if (!/pdf/.test(d.mime)) return <div className="kdoc-img" style={{ transform: `scale(${zoom / 100}) rotate(${rot}deg)` }}>{DOC_LABEL(d.doc_type)} · {d.ref}<br/><span>{d.mime} · rendered from the content stream</span></div>;
  return <div className="kdoc-paper" style={{ transform: `scale(${zoom / 100}) rotate(${rot}deg)` }}>
    <p className="c">REGISTRAR · OFFICIAL COPY · PAGE {page}</p><h4>{DOC_LABEL(d.doc_type).toUpperCase()}</h4>
    <div className="ln" style={{ width: '92%', marginTop: 12 }}></div><div className="ln" style={{ width: '84%' }}></div><div className="ln" style={{ width: '68%' }}></div>
    <div className="row"><b>Entity</b><span>H•••• Capital Partners Ltd</span></div>
    <div className="row"><b>Registration no.</b><span className="mono">CR-38•••1</span></div>
    <div className="row"><b>Issued</b><span>{kDate(d.issued_at)}</span></div>
    <div className="ln" style={{ width: '95%', marginTop: 10 }}></div><div className="ln" style={{ width: '88%' }}></div><div className="ln" style={{ width: '60%' }}></div>
    <div className="seal">SEAL</div>
  </div>;
}

function DocViewer({ view, rows, SECT, ticks, setTicks, mine, onClose }) {
  const forced = window.V3_DOCRESP || 'ok';
  const [cur, setCur] = useState(view.ref), [phase, setPhase] = useState('loading'), [pct, setPct] = useState(0), [page, setPage] = useState(1), [zoom, setZoom] = useState(100), [rot, setRot] = useState(0), [retried, setRetried] = useState(false), [dl, setDl] = useState(false);
  const d = rows.find(r => r.ref === cur);
  const load = (again) => {
    setPhase('loading'); setPct(0); setPage(1); setZoom(100); setRot(0);
    if (forced === 'loading') { setPct(62); return; }
    let p = 0; const t = setInterval(() => { p += 22; setPct(Math.min(p, 100)); if (p >= 100) { clearInterval(t); setPhase(again ? 'ok' : forced); } }, 140);
    return () => clearInterval(t);
  };
  useEffect(() => load(retried), [cur]);
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  if (!d) return null;
  const pinned = view.item, chain = view.refs || [cur], idx = chain.indexOf(cur), next = chain[idx + 1];
  const used = itemsFor(d.ref, rows, SECT).filter(c => !pinned || c.key !== pinned.key);
  const ready = phase === 'ok';
  const Tick = ({ c, big }) => <label className={`kdoc-ck ${big ? 'big' : ''}`}><input type="checkbox" disabled={!mine} checked={!!ticks[c.key]} onChange={() => setTicks(t => ({ ...t, [c.key]: !t[c.key] }))}/><span>{c.text}</span></label>;
  const ST = { error: ['!', 'neg', "Couldn't open the document", 'The file didn\'t load. Check your connection and try again.', <PmsButton sm variant="primary" onClick={() => { setRetried(true); load(true); }}>Retry</PmsButton>, 'request id 7f3a…c21e'],
    limit: ['⏱', 'warn', 'Download limit reached for this hour', 'Try again in 23 min.', <PmsButton sm disabled>Retry in 23:00</PmsButton>],
    missing: ['∅', 'neg', 'File not found', 'The record exists but the file is missing from storage. Ask the client to upload it again.', <PmsButton sm variant="ghost" reason="Request-again flow is phase 2">Request again</PmsButton>] }[phase];
  return ReactDOM.createPortal(<div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="kdoc-vw">
    <div className="kdoc-vw__h"><span className="modal__title">{DOC_LABEL(d.doc_type)}</span><span className="mono muted" style={{ fontSize: 12 }}>{d.ref}</span><RoundTag sm tone={{ verified: 'positive', uploaded: 'info', expired: 'negative', missing: 'neutral' }[d.status]}>{d.status}</RoundTag>{d.person_masked && <span className="muted" style={{ fontSize: 12 }}>· {d.person_masked}</span>}<button className="modal__close" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button></div>
    <div className="kdoc-vw__b">
      <aside className="kdoc-meta">
        {pinned && <div className="kdoc-pin"><p className="kpi__label" style={{ color: '#c9a6ff' }}>Checking</p><Tick c={pinned} big/><p className="muted" style={{ fontSize: 10.5, lineHeight: 1.5 }}>Compare the document with the case record. Tick when it matches.</p></div>}
        <div><p className="kpi__label">Document</p><dl className="dl" style={{ marginTop: 10, fontSize: 11.5 }}><dt>Ref</dt><dd>{d.ref}</dd><dt>Type</dt><dd style={{ fontFamily: 'Montserrat' }}>{DOC_LABEL(d.doc_type)}</dd><dt>Person</dt><dd>{d.person_masked || 'entity'}</dd><dt>Uploaded</dt><dd>{kDate(d.uploaded_at)}</dd><dt>File</dt><dd>{fileLabel(d)}</dd><dt>SHA-256</dt><dd title={d.sha + '…'}>{d.sha.slice(0, 4)}…{d.sha.slice(-4)}</dd></dl></div>
        {used.length > 0 && <div><p className="kpi__label">{pinned ? 'Also evidence for' : 'Used as evidence for'}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>{used.map(c => <Tick key={c.key} c={c}/>)}</div><p className="muted" style={{ fontSize: 10.5, marginTop: 8 }}>{mine ? 'Ticking here updates the case checklist.' : 'Claim the case to tick items.'}</p></div>}
      </aside>
      <div className="kdoc-stage">
        <div className="kdoc-tb">
          {/pdf/.test(d.mime) && <span className="kdoc-grp"><button disabled={!ready || page <= 1} onClick={() => setPage(p => p - 1)}>‹</button><span>Page {ready ? page : '–'} / {ready ? d.page_count : '–'}</span><button disabled={!ready || page >= d.page_count} onClick={() => setPage(p => p + 1)}>›</button></span>}
          <span className="kdoc-grp"><button disabled={!ready || zoom <= 50} onClick={() => setZoom(z => z - 25)}>−</button><span>{zoom}%</span><button disabled={!ready || zoom >= 300} onClick={() => setZoom(z => z + 25)}>+</button></span>
          <span className="kdoc-grp"><button disabled={!ready} onClick={() => setZoom(100)}>Fit width</button><button disabled={!ready} onClick={() => setRot(r => (r + 90) % 360)}>⟳</button></span>
          <span style={{ flex: 1 }}></span>
          {chain.length > 1 ? <span className="muted" style={{ fontSize: 11 }}>{idx + 1} of {chain.length} evidence documents{next && <> · <a onClick={() => setCur(next)}>Next: {next} ›</a></>}</span> : <span className="muted" style={{ fontSize: 11 }}>rendered in the browser · no copy kept</span>}
        </div>
        <div className="kdoc-canvas">
          {ready && /pdf/.test(d.mime) && d.page_count > 1 && <div className="kdoc-thumbs">{Array.from({ length: d.page_count }, (_, i) => <i key={i} className={page === i + 1 ? 'on' : ''} onClick={() => setPage(i + 1)}></i>)}</div>}
          {phase === 'loading' && <div className="kdoc-ctr"><div className="kdoc-skel"></div><div className="kdoc-bar"><i style={{ width: pct + '%' }}></i></div><p><b style={{ color: '#fff' }}>Opening {d.ref}…</b> {(d.size_kb * pct / 100 / 1000).toFixed(1)} of {(d.size_kb / 1000).toFixed(1)} MB</p></div>}
          {ready && <div className="kdoc-page"><DocPaper d={d} page={page} zoom={zoom} rot={rot}/></div>}
          {ST && <div className="kdoc-ctr"><span className={`kdoc-ic ${ST[1]}`}>{ST[0]}</span><p className="h">{ST[2]}</p><p>{ST[3]}</p>{ST[4]}{ST[5] && <p className="mono muted" style={{ fontSize: 10 }}>{ST[5]}</p>}</div>}
        </div>
      </div>
    </div>
    <div className="kdoc-vw__f"><span className="muted" style={{ fontSize: 11, marginRight: 'auto' }}>🔒 Opening a document is logged.{dl && <span className="pos"> · download started</span>}</span><PmsButton variant="ghost" onClick={onClose}>Close</PmsButton><PmsButton reason={phase === 'limit' ? 'Download limit reached for this hour. Try again in 23 min.' : phase === 'missing' ? 'File not found' : undefined} onClick={() => setDl(true)}>Download</PmsButton></div>
  </div></div>, document.body);
}

Object.assign(window, { kycDocRows, fileLabel, evidenceFor, DocActions, EvidenceLink, DocViewer, DOC_LABEL });
