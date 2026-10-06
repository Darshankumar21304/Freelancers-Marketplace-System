import React, { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Video, Music, ExternalLink, Archive, Code, Copy, Check, HardDrive, Link2, Globe, Palette } from 'lucide-react';
import PdfCanvasViewer from './PdfCanvasViewer';

const GithubIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function MediaPreviewModal({ isOpen, onClose, file }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !file) return null;

  const url = file.url || '';
  const name = file.name || file.title || 'Deliverable Asset';
  const fileName = name.toLowerCase();
  const fileUrl = url.toLowerCase();
  const mimeType = (file.type || '').toLowerCase();
  const linkType = (file.linkType || file.type || '').toLowerCase();

  // Precise type detection
  const isDrive = file.isDrive || linkType === 'drive' || fileUrl.includes('drive.google.com') || fileUrl.includes('docs.google.com') || fileUrl.includes('dropbox.com') || fileUrl.includes('onedrive');
  const isFigma = file.isFigma || linkType === 'figma' || fileUrl.includes('figma.com') || fileUrl.includes('canva.com');
  const isGithub = file.isGithub || linkType === 'github' || fileUrl.includes('github.com') || fileUrl.includes('gitlab.com');
  const isZip = !isDrive && !isFigma && !isGithub && (
                fileName.endsWith('.zip') || 
                fileName.endsWith('.rar') || 
                fileName.endsWith('.7z') || 
                fileName.endsWith('.tar') || 
                fileName.endsWith('.gz') || 
                mimeType.includes('zip') || 
                mimeType.includes('compressed') || 
                file.isZip
  );

  const isPdf = !isDrive && !isFigma && !isGithub && !isZip && (
                fileName.endsWith('.pdf') || 
                mimeType.includes('pdf') || 
                fileUrl.includes('.pdf') || 
                fileUrl.includes('/documents/')
  );

  const isImage = !isDrive && !isFigma && !isGithub && !isZip && !isPdf && (
    /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileUrl) || 
    /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(fileName) || 
    mimeType.startsWith('image/')
  );

  const isVideo = !isDrive && !isFigma && !isGithub && !isZip && (/\.(mp4|webm|ogg|mov)$/i.test(fileUrl) || mimeType.startsWith('video/'));
  const isAudio = !isDrive && !isFigma && !isGithub && !isZip && (/\.(mp3|wav|ogg|m4a)$/i.test(fileUrl) || mimeType.startsWith('audio/'));
  const isGenericLink = file.isLink || (!isImage && !isPdf && !isVideo && !isAudio && !isZip && url.startsWith('http'));

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        zIndex: 999999,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          maxWidth: '960px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            {isDrive && <HardDrive size={20} color="#2563eb" />}
            {isFigma && <Palette size={20} color="#a855f7" />}
            {isGithub && <GithubIcon size={20} color="#0f172a" />}
            {isZip && <Archive size={20} color="#d97706" />}
            {isImage && <ImageIcon size={20} color="#1a73e8" />}
            {isPdf && <FileText size={20} color="#dc2626" />}
            {isVideo && <Video size={20} color="#9333ea" />}
            {isAudio && <Music size={20} color="#16a34a" />}
            {!isDrive && !isFigma && !isGithub && !isZip && !isImage && !isPdf && !isVideo && !isAudio && <Globe size={20} color="#0284c7" />}
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDrive || isFigma || isGithub || isGenericLink ? (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ padding: '6px 14px', background: isDrive ? '#2563eb' : (isFigma ? '#a855f7' : (isGithub ? '#24292f' : '#0284c7')), color: '#ffffff', borderRadius: '30px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} /> Open Link
              </a>
            ) : (
              <a 
                href={url} 
                download={name}
                target="_blank" 
                rel="noopener noreferrer"
                style={{ padding: '6px 14px', background: '#e8f0fe', color: '#1a73e8', borderRadius: '30px', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={14} /> {isZip ? 'Download ZIP' : 'Download File'}
              </a>
            )}
            <button 
              onClick={onClose}
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Media Viewport */}
        <div style={{ padding: isPdf ? 0 : '1.5rem', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '460px', height: isPdf ? '76vh' : 'auto', background: isPdf ? '#0f172a' : '#0b1120' }}>
          {isDrive && (
            <div style={{ background: '#ffffff', padding: '36px 32px', borderRadius: '20px', maxWidth: '540px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #bfdbfe' }}>
                <HardDrive size={36} color="#2563eb" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', display: 'inline-block', marginBottom: '8px' }}>
                Google Drive / Cloud Folder Link
              </span>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{name}</h3>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.88rem', wordBreak: 'break-all' }}>{url}</p>
              {file.description && <p style={{ margin: '0 0 20px', color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>{file.description}</p>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ padding: '12px 26px', background: '#2563eb', color: '#fff', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)' }}
                >
                  <ExternalLink size={16} /> Open Google Drive Folder
                </a>
                <button 
                  onClick={() => handleCopy(url)}
                  style={{ padding: '12px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
              </div>
            </div>
          )}

          {isFigma && (
            <div style={{ background: '#ffffff', padding: '36px 32px', borderRadius: '20px', maxWidth: '540px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #e9d5ff' }}>
                <Palette size={36} color="#a855f7" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '12px', background: '#faf5ff', color: '#7e22ce', display: 'inline-block', marginBottom: '8px' }}>
                Figma / Design Link
              </span>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{name}</h3>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.88rem', wordBreak: 'break-all' }}>{url}</p>
              {file.description && <p style={{ margin: '0 0 20px', color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>{file.description}</p>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ padding: '12px 26px', background: '#a855f7', color: '#fff', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.25)' }}
                >
                  <ExternalLink size={16} /> Open Figma Prototype
                </a>
                <button 
                  onClick={() => handleCopy(url)}
                  style={{ padding: '12px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy URL'}
                </button>
              </div>
            </div>
          )}

          {isGithub && (
            <div style={{ background: '#ffffff', padding: '36px 32px', borderRadius: '20px', maxWidth: '560px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #e2e8f0' }}>
                <GithubIcon size={36} color="#0f172a" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '12px', background: '#f1f5f9', color: '#0f172a', display: 'inline-block', marginBottom: '8px' }}>
                GitHub Repository Link
              </span>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{name}</h3>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.88rem', wordBreak: 'break-all' }}>{url}</p>

              {/* Quick Git Clone command box */}
              <div style={{ background: '#0f172a', color: '#38bdf8', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                  git clone {url.endsWith('.git') ? url : `${url}.git`}
                </span>
                <button 
                  onClick={() => handleCopy(`git clone ${url.endsWith('.git') ? url : `${url}.git`}`)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                >
                  {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ padding: '12px 24px', background: '#24292f', color: '#fff', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}
                >
                  <ExternalLink size={16} /> Open on GitHub
                </a>
                <button 
                  onClick={() => handleCopy(url)}
                  style={{ padding: '12px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Copy size={15} /> Copy URL
                </button>
              </div>
            </div>
          )}

          {isZip && (
            <div style={{ background: '#ffffff', padding: '36px 32px', borderRadius: '20px', maxWidth: '520px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #fde68a' }}>
                <Archive size={34} color="#d97706" />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'inline-block', marginBottom: '8px' }}>
                ZIP Code Archive / Package
              </span>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{name}</h3>
              <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.88rem' }}>
                {file.size ? `Archive Size: ${file.size} • ` : ''}Compressed deliverables package ready for extraction.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a 
                  href={url} 
                  download={name}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ padding: '12px 28px', background: '#d97706', color: '#fff', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)' }}
                >
                  <Download size={16} /> Download ZIP Archive
                </a>
                <button 
                  onClick={() => handleCopy(url)}
                  style={{ padding: '12px 20px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Copy size={15} /> Copy Link
                </button>
              </div>
            </div>
          )}

          {isImage && (
            <img 
              src={url} 
              alt={name} 
              style={{ maxWidth: '100%', maxHeight: '74vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} 
            />
          )}

          {isPdf && (
            <PdfCanvasViewer url={url} filename={name} />
          )}

          {isVideo && (
            <video 
              controls 
              autoPlay 
              style={{ maxWidth: '100%', maxHeight: '74vh', borderRadius: '12px' }}
            >
              <source src={url} />
              Your browser does not support the video tag.
            </video>
          )}

          {isAudio && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', textOverflow: 'ellipsis', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
              <Music size={48} color="#1a73e8" style={{ marginBottom: '16px' }} />
              <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0f172a' }}>{name}</h4>
              <audio controls src={url} style={{ width: '100%', minWidth: '300px' }} />
            </div>
          )}

          {!isDrive && !isFigma && !isGithub && !isZip && !isImage && !isPdf && !isVideo && !isAudio && (
            <div style={{ background: '#fff', padding: '40px 30px', borderRadius: '16px', textAlign: 'center', maxWidth: '440px', width: '100%', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
              <Globe size={48} color="#0284c7" style={{ marginBottom: '16px' }} />
              <h4 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{name}</h4>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.85rem', wordBreak: 'break-all' }}>{url}</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ padding: '10px 24px', background: '#0284c7', color: '#fff', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <ExternalLink size={16} /> Open Web Link
                </a>
                <button 
                  onClick={() => handleCopy(url)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
