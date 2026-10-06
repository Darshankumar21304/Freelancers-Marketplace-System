import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, List, Grid, MoreVertical, Plus, 
  ChevronRight, ChevronLeft, Calendar, Clock, CreditCard, LayoutTemplate, MessageSquare, Briefcase, FileText, Edit, X, Save,
  Shield, Upload, FileCheck, CheckCircle2, MessageCircle, DollarSign, Download, Paperclip, Lock, UserCheck, Trash2,
  Info, HelpCircle, ShieldCheck, AlertCircle, Archive, ExternalLink, Code, Folder, Layers, Globe
} from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { uploadFileToCloudinary } from '../../utils/fileUpload';
import MediaPreviewModal from '../../components/MediaPreviewModal';
import './Orders.css';

const GithubIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Orders() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('All Projects');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  
  // Media Preview Modal State
  const [previewFile, setPreviewFile] = useState(null);
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);
  
  // Escrow & Commission Guide Modal State
  const [isEscrowInfoModalOpen, setIsEscrowInfoModalOpen] = useState(false);
  
  // Edit Project Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Workspace State
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState('overview');
  const [workspaceNotes, setWorkspaceNotes] = useState('');
  const [workspaceNotesSaved, setWorkspaceNotesSaved] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isClientGithubModalOpen, setIsClientGithubModalOpen] = useState(false);
  const [clientGithubForm, setClientGithubForm] = useState({ title: '', url: '', description: '' });
  const [workspaceMilestones, setWorkspaceMilestones] = useState([
    { id: 1, title: 'Project Initialization & Architecture', amount: 500, status: 'Paid', dueDate: 'Sep 05, 2026' },
    { id: 2, title: 'Core Functionality & Integration', amount: 1200, status: 'In Progress', dueDate: 'Sep 15, 2026' },
    { id: 3, title: 'Final QA, Deployment & Handoff', amount: 800, status: 'Pending', dueDate: 'Sep 25, 2026' }
  ]);

  const navigate = useNavigate();

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [selectedProjectForMilestone, setSelectedProjectForMilestone] = useState(null);
  const [newMilestone, setNewMilestone] = useState({ title: '', amount: '', date: '' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = ['All Projects', 'Draft', 'Open', 'In Progress', 'Completed', 'Closed'];

  const [activeContract, setActiveContract] = useState(null);
  const [isLoadingWorkspaceData, setIsLoadingWorkspaceData] = useState(false);

  useEffect(() => {
    const fetchWorkspaceContract = async () => {
      if (!activeWorkspace) {
        setActiveContract(null);
        return;
      }
      setIsLoadingWorkspaceData(true);
      try {
        const projId = String(activeWorkspace.id || activeWorkspace._id || '');

        // 1. Fetch fresh project attachments from backend
        const freshProjRes = await apiFetch(`/projects/${projId}`).catch(() => null);
        const freshProj = freshProjRes?.project || freshProjRes;
        const currentAtts = (freshProj && Array.isArray(freshProj.attachments)) ? freshProj.attachments : (activeWorkspace.attachments || []);

        let loadedFiles = currentAtts.map(att => {
          let fullUrl = '';
          let name = 'Project Deliverable';
          let type = '';

          if (typeof att === 'string') {
            if (att.startsWith('http://') || att.startsWith('https://')) {
              fullUrl = att;
              name = att.split('/').pop().split('?')[0];
            } else {
              fullUrl = `https://res.cloudinary.com/s5moukpf/image/upload/v1788070426/gigsphere/avatars/${att}.jpg`;
              name = `Attachment_${att.slice(0, 8)}.jpg`;
              type = 'image/jpeg';
            }
          } else if (att && typeof att === 'object') {
            fullUrl = att.url || '';
            name = att.name || (fullUrl ? fullUrl.split('/').pop() : 'Deliverable Document');
            type = att.type || '';
          }

          const isDrive = (att && att.isDrive) || (fullUrl && (fullUrl.includes('drive.google.com') || fullUrl.includes('docs.google.com') || fullUrl.includes('dropbox.com') || fullUrl.includes('onedrive')));
          const isFigma = (att && att.isFigma) || (fullUrl && (fullUrl.includes('figma.com') || fullUrl.includes('canva.com')));
          const isGithub = (att && att.isGithub) || (fullUrl && fullUrl.includes('github.com')) || (name && name.toLowerCase().includes('github'));
          const isZip = !isDrive && !isFigma && !isGithub && ((att && att.isZip) || (name && /\.(zip|rar|7z|tar|gz)$/i.test(name)) || (fullUrl && /\.(zip|rar|7z|tar|gz)/i.test(fullUrl)) || (type && type.includes('zip')));

          const rawUploadedBy = (att && typeof att === 'object' && att.uploadedBy) ? att.uploadedBy : '';
          const uploadedBy = rawUploadedBy ? rawUploadedBy : (isGithub || (name && (name.toLowerCase().includes('requirement') || name.toLowerCase().includes('submission') || name.toLowerCase().includes('vault'))) ? 'Freelancer' : 'Client');

          return {
            name,
            url: fullUrl,
            type,
            isDrive,
            isFigma,
            isGithub,
            isZip,
            isLink: isDrive || isFigma || isGithub || (att && att.isLink) || fullUrl.startsWith('http'),
            size: isDrive ? 'Google Drive Folder' : (isFigma ? 'Figma Design' : (isGithub ? 'GitHub Repository' : (isZip ? 'ZIP Archive' : 'Project Asset'))),
            uploadedBy
          };
        });

        // 2. Merge freelancer shared deliverables from local storage if available
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('gigsphere_fl_deliverables_')) {
              const savedVal = localStorage.getItem(key);
              if (savedVal) {
                const parsed = JSON.parse(savedVal);
                if (Array.isArray(parsed)) {
                  parsed.forEach(f => {
                    if (f && f.url && !loadedFiles.some(existing => existing.url === f.url)) {
                      const isDrive = f.isDrive || (f.url && (f.url.includes('drive.google.com') || f.url.includes('dropbox.com') || f.url.includes('onedrive')));
                      const isFigma = f.isFigma || (f.url && (f.url.includes('figma.com') || f.url.includes('canva.com')));
                      const isGithub = f.isGithub || (f.url && f.url.includes('github.com')) || (f.name && f.name.toLowerCase().includes('github'));
                      const isZip = f.isZip || (!isDrive && !isFigma && !isGithub && (f.name && /\.(zip|rar|7z|tar|gz)$/i.test(f.name)));
                      loadedFiles.push({
                        name: f.name || 'Freelancer Deliverable',
                        url: f.url,
                        type: f.type || '',
                        isDrive,
                        isFigma,
                        isGithub,
                        isZip,
                        isLink: isDrive || isFigma || isGithub || f.isLink || f.url.startsWith('http'),
                        size: f.size || (isDrive ? 'Google Drive Folder' : (isFigma ? 'Figma Design' : (isGithub ? 'GitHub Repository' : (isZip ? 'ZIP Archive' : 'Project Deliverable')))),
                        uploadedBy: f.uploadedBy || 'Freelancer',
                        uploadedAt: f.uploadedAt || ''
                      });
                    }
                  });
                }
              }
            }
          }
        } catch(e) {}

        setWorkspaceFiles(loadedFiles);

        // 3. Fetch active contract
        const contracts = await apiFetch(`/contracts/active?projectId=${projId}`).catch(() => []);
        
        let matched = Array.isArray(contracts) ? contracts.find(c => {
          const cProjId = String(c.project_id?._id || c.project_id || '');
          return cProjId === projId;
        }) : null;

        if (!matched && Array.isArray(contracts) && contracts.length > 0) {
          matched = contracts[0];
        }

        if (matched) {
          setActiveContract(matched);
          const formatted = (matched.milestones || []).map((m, idx) => ({
            id: m._id || m.id || idx,
            _id: m._id || m.id || idx,
            title: m.title,
            amount: m.amount,
            status: m.status === 'Completed' ? 'Paid' : m.status,
            dueDate: new Date(m.deadline).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          }));
          setWorkspaceMilestones(formatted);
        } else {
          setActiveContract(null);
          setWorkspaceMilestones([]);
        }
      } catch (err) {
        console.error('Failed to load workspace contract:', err);
        setActiveContract(null);
        setWorkspaceMilestones([]);
      } finally {
        setIsLoadingWorkspaceData(false);
      }
    };

    fetchWorkspaceContract();

    if (activeWorkspace) {
      const projId = activeWorkspace.id || activeWorkspace._id;
      const savedNotes = localStorage.getItem(`gigsphere_notes_${projId}`) || activeWorkspace.workspaceNotes || '';
      setWorkspaceNotes(savedNotes);
      setWorkspaceNotesSaved(false);
    }
  }, [activeWorkspace]);

  const handleReleaseEscrow = async (milestoneId, amount) => {
    try {
      const res = await apiFetch(`/contracts/${activeContract._id}/milestones/${milestoneId}/approve`, {
        method: 'PUT'
      });
      if (res && res.success) {
        setWorkspaceMilestones(prev => prev.map(item => item.id === milestoneId ? { ...item, status: 'Paid' } : item));
        alert(`Payment of ${formatINR(amount)} released successfully to freelancer!`);
      }
    } catch (err) {
      alert(err.message || 'Error releasing escrow payment');
    }
  };

  const handleFundEscrow = async (milestoneId, amount) => {
    try {
      const res = await apiFetch(`/contracts/${activeContract._id}/milestones/${milestoneId}/fund`, {
        method: 'PUT'
      });
      if (res && res.success) {
        setWorkspaceMilestones(prev => prev.map(item => item.id === milestoneId ? { ...item, status: 'In Progress' } : item));
        alert(`Escrow of ${formatINR(amount)} funded successfully!`);
      }
    } catch (err) {
      alert(err.message || 'Error funding escrow milestone');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await apiFetch('/projects/my').catch(() => []);
      if (Array.isArray(data)) {
        setProjects(data.map(p => ({
          ...p,
          id: p._id || p.id,
          status: p.status || 'Open',
          rawProposals: Array.isArray(p.proposals) ? p.proposals : [],
          proposals: Array.isArray(p.proposals) ? p.proposals.length : (typeof p.proposals === 'number' ? p.proposals : 0),
          postedDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'
        })));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const formatDeadline = (deadline, duration) => {
    const val = deadline || duration;
    if (!val) return 'Not set';
    if (typeof val === 'string' && (val.includes('-') || val.includes('/'))) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    return val;
  };

  const handleActionClick = async (action, project, e) => {
    if (e) e.stopPropagation();
    setMenuOpen(null);
    const projId = project.id || project._id;

    if (action === 'View Proposals') {
      navigate('/client/dashboard/proposals');
    } else if (action === 'Edit') {
      setEditingProject({
        id: projId,
        title: project.title || '',
        category: project.category || 'Web Development',
        budget: project.budget || '',
        deadline: project.deadline || '',
        description: project.description || ''
      });
      setIsEditModalOpen(true);
    } else if (action === 'Pause') {
      try {
        await apiFetch(`/projects/${projId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Paused' }) });
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? { ...p, status: 'Paused' } : p));
      } catch (err) { alert('Failed to pause project'); }
    } else if (action === 'Resume') {
      try {
        await apiFetch(`/projects/${projId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Open' }) });
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? { ...p, status: 'Open' } : p));
      } catch (err) { alert('Failed to resume project'); }
    } else if (action === 'Close') {
      try {
        await apiFetch(`/projects/${projId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'Closed' }) });
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? { ...p, status: 'Closed' } : p));
      } catch (err) { alert('Failed to close project'); }
    } else if (action === 'Delete') {
      if (window.confirm(`Are you sure you want to delete '${project.title}'?`)) {
        try {
          await apiFetch(`/projects/${projId}`, { method: 'DELETE' });
          setProjects(prev => prev.filter(p => (p.id !== projId && p._id !== projId)));
        } catch (err) { alert('Failed to delete project'); }
      }
    } else if (action === 'Milestones') {
      setSelectedProjectForMilestone(project);
      setIsMilestoneModalOpen(true);
    } else if (action === 'Messages') {
      const flId = project?.freelancer_id || project?.freelancer?.id || project?.freelancer?._id;
      navigate('/client/dashboard/chat', {
        state: {
          partnerId: flId,
          name: project?.freelancer?.name || project?.freelancerName,
          avatar: project?.freelancer?.avatar,
          title: project?.title
        }
      });
    } else if (action === 'Workspace') {
      setActiveWorkspace(project);
      setWorkspaceTab('overview');
      const projId = project.id || project._id;

      let loadedFiles = [];
      if (project.attachments && Array.isArray(project.attachments)) {
        loadedFiles = project.attachments.map(att => {
          let fullUrl = '';
          let name = 'Project Deliverable';
          let type = '';

          if (typeof att === 'string') {
            if (att.startsWith('http://') || att.startsWith('https://')) {
              fullUrl = att;
              name = att.split('/').pop().split('?')[0];
            } else {
              fullUrl = `https://res.cloudinary.com/s5moukpf/image/upload/v1788070426/gigsphere/avatars/${att}.jpg`;
              name = `Attachment_${att.slice(0, 8)}.jpg`;
              type = 'image/jpeg';
            }
          } else if (att && typeof att === 'object') {
            fullUrl = att.url || '';
            name = att.name || (fullUrl ? fullUrl.split('/').pop() : 'Deliverable Document');
            type = att.type || '';
          }

          const isDrive = (att && att.isDrive) || (fullUrl && (fullUrl.includes('drive.google.com') || fullUrl.includes('docs.google.com') || fullUrl.includes('dropbox.com') || fullUrl.includes('onedrive')));
          const isFigma = (att && att.isFigma) || (fullUrl && (fullUrl.includes('figma.com') || fullUrl.includes('canva.com')));
          const isGithub = (att && att.isGithub) || (fullUrl && fullUrl.includes('github.com')) || (name && name.toLowerCase().includes('github'));
          const isZip = !isDrive && !isFigma && !isGithub && ((att && att.isZip) || (name && /\.(zip|rar|7z|tar|gz)$/i.test(name)) || (fullUrl && /\.(zip|rar|7z|tar|gz)/i.test(fullUrl)) || (type && type.includes('zip')));

          return {
            name,
            url: fullUrl,
            type,
            isDrive,
            isFigma,
            isGithub,
            isZip,
            isLink: isDrive || isFigma || isGithub || (att && att.isLink) || fullUrl.startsWith('http'),
            size: isDrive ? 'Google Drive Folder' : (isFigma ? 'Figma Design' : (isGithub ? 'GitHub Repository' : (isZip ? 'ZIP Archive' : 'Project Asset')))
          };
        });
      }

      // Merge freelancer shared deliverables from local storage if available
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('gigsphere_fl_deliverables_')) {
            const savedVal = localStorage.getItem(key);
            if (savedVal) {
              const parsed = JSON.parse(savedVal);
              if (Array.isArray(parsed)) {
                parsed.forEach(f => {
                  if (f && f.url && !loadedFiles.some(existing => existing.url === f.url)) {
                    const isDrive = f.isDrive || (f.url && (f.url.includes('drive.google.com') || f.url.includes('dropbox.com') || f.url.includes('onedrive')));
                    const isFigma = f.isFigma || (f.url && (f.url.includes('figma.com') || f.url.includes('canva.com')));
                    const isGithub = f.isGithub || (f.url && f.url.includes('github.com')) || (f.name && f.name.toLowerCase().includes('github'));
                    const isZip = f.isZip || (!isDrive && !isFigma && !isGithub && (f.name && /\.(zip|rar|7z|tar|gz)$/i.test(f.name)));
                    loadedFiles.push({
                      name: f.name || 'Freelancer Deliverable',
                      url: f.url,
                      type: f.type || '',
                      isDrive,
                      isFigma,
                      isGithub,
                      isZip,
                      isLink: isDrive || isFigma || isGithub || f.isLink || f.url.startsWith('http'),
                      size: f.size || (isDrive ? 'Google Drive Folder' : (isFigma ? 'Figma Design' : (isGithub ? 'GitHub Repository' : (isZip ? 'ZIP Archive' : 'Project Deliverable')))),
                      uploadedBy: f.uploadedBy || 'Freelancer',
                      uploadedAt: f.uploadedAt || ''
                    });
                  }
                });
              }
            }
          }
        }
      } catch(e) {}

      setWorkspaceFiles(loadedFiles);
    }
  };

  const handleSaveEditProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsSavingEdit(true);
    try {
      await apiFetch(`/projects/${editingProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editingProject.title,
          budget: editingProject.budget,
          category: editingProject.category,
          deadline: editingProject.deadline,
          description: editingProject.description
        })
      });

      setProjects(prev => prev.map(p => (p.id === editingProject.id || p._id === editingProject.id) ? { ...p, ...editingProject } : p));
      setIsEditModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      alert('Failed to update project details');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const convertWorkspaceFilesToAttachments = (filesList) => {
    return filesList.map(f => ({
      name: f.name,
      url: f.url,
      type: f.type || '',
      isDrive: !!f.isDrive,
      isFigma: !!f.isFigma,
      isGithub: !!f.isGithub,
      isZip: !!f.isZip,
      isLink: !!f.isLink,
      size: f.size || '',
      description: f.description || '',
      uploadedBy: f.uploadedBy || 'Client',
      uploadedAt: f.uploadedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const handleUploadWorkspaceFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const res = await uploadFileToCloudinary(file, '/api/upload/single');
      const fileUrl = res.url || res.secure_url;
      const isZip = file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z') || file.type.includes('zip');
      const newFileObj = {
        name: file.name,
        url: fileUrl,
        type: file.type,
        isZip,
        size: isZip ? `${(file.size / (1024 * 1024)).toFixed(2)} MB (ZIP)` : `${(file.size / 1024).toFixed(1)} KB`,
        uploadedBy: 'Client',
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updatedFiles = [...workspaceFiles, newFileObj];
      setWorkspaceFiles(updatedFiles);

      if (activeWorkspace) {
        const projId = activeWorkspace.id || activeWorkspace._id;
        const updatedAtts = convertWorkspaceFilesToAttachments(updatedFiles);
        setActiveWorkspace(prev => prev ? { ...prev, attachments: updatedAtts } : prev);
        setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? { ...p, attachments: updatedAtts } : p));
        await apiFetch(`/projects/${projId}`, {
          method: 'PUT',
          body: JSON.stringify({ attachments: updatedAtts })
        });
      }
    } catch (err) {
      alert('Failed to upload deliverable: ' + err.message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddClientExternalLink = async (e) => {
    e.preventDefault();
    if (!clientGithubForm.url || !clientGithubForm.title) {
      alert('Please provide resource URL and a title');
      return;
    }
    const url = clientGithubForm.url;
    const category = clientGithubForm.category || 'drive';
    const isDrive = category === 'drive' || url.includes('drive.google.com') || url.includes('dropbox.com') || url.includes('onedrive');
    const isFigma = category === 'figma' || url.includes('figma.com') || url.includes('canva.com');
    const isGithub = category === 'github' || url.includes('github.com') || url.includes('gitlab.com');

    const newLinkObj = {
      name: clientGithubForm.title,
      url: clientGithubForm.url,
      type: category,
      linkType: category,
      isDrive,
      isFigma,
      isGithub,
      isLink: true,
      size: isDrive ? 'Google Drive Folder' : (isFigma ? 'Figma Design' : (isGithub ? 'GitHub Repository' : 'External Web Link')),
      description: clientGithubForm.description,
      uploadedBy: 'Client',
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedFiles = [...workspaceFiles, newLinkObj];
    setWorkspaceFiles(updatedFiles);

    if (activeWorkspace) {
      const projId = activeWorkspace.id || activeWorkspace._id;
      const updatedAtts = convertWorkspaceFilesToAttachments(updatedFiles);
      setActiveWorkspace(prev => prev ? { ...prev, attachments: updatedAtts } : prev);
      setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? { ...p, attachments: updatedAtts } : p));
      try {
        await apiFetch(`/projects/${projId}`, {
          method: 'PUT',
          body: JSON.stringify({ attachments: updatedAtts })
        });
      } catch (err) {
        console.error('Failed to sync link:', err);
      }
    }

    setClientGithubForm({ title: '', url: '', description: '', category: 'drive' });
    setIsClientGithubModalOpen(false);
  };

  const handleDeleteWorkspaceFile = async (fileIndex) => {
    const updatedFiles = workspaceFiles.filter((_, i) => i !== fileIndex);
    setWorkspaceFiles(updatedFiles);

    if (activeWorkspace) {
      const projId = activeWorkspace.id || activeWorkspace._id;
      const updatedAtts = convertWorkspaceFilesToAttachments(updatedFiles);
      setActiveWorkspace(prev => prev ? { ...prev, attachments: updatedAtts } : prev);
      setProjects(prev => prev.map(p => (p.id === projId || p._id === projId) ? { ...p, attachments: updatedAtts } : p));
      try {
        await apiFetch(`/projects/${projId}`, {
          method: 'PUT',
          body: JSON.stringify({ attachments: updatedAtts })
        });
      } catch (err) {
        console.error('Failed to sync deleted attachment:', err);
      }
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesTab = activeTab === 'All Projects' || p.status === activeTab;
    const matchesSearch = p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const StatusBadge = ({ status }) => {
    const statusClass = (status || 'Open').replace(/\s+/g, '-').toLowerCase();
    return (
      <span className={`client-projects-status client-projects-status-${statusClass}`}>
        {status || 'Open'}
      </span>
    );
  };

  const getActions = (status) => {
    switch (status) {
      case 'Draft': return ['Edit', 'Publish', 'Delete'];
      case 'Open': return ['View Proposals', 'Edit', 'Pause', 'Close', 'Delete'];
      case 'Paused': return ['View Proposals', 'Edit', 'Resume', 'Close', 'Delete'];
      case 'In Progress': return ['Workspace', 'Messages', 'Milestones', 'Edit', 'Delete'];
      case 'Completed': return ['View Details', 'Invoice', 'Review Freelancer', 'Delete'];
      default: return ['View Details', 'Edit', 'Delete'];
    }
  };

  // FULLY FEATURED RICH WORKSPACE VIEW
  if (activeWorkspace) {
    const rawProposals = Array.isArray(activeWorkspace?.rawProposals) 
      ? activeWorkspace.rawProposals 
      : (Array.isArray(activeWorkspace?.proposals) ? activeWorkspace.proposals : []);

    const hiredProp = rawProposals.find(p => (p?.status || '').toLowerCase() === 'hired' || (p?.status || '').toLowerCase() === 'accepted');

    const hiredFreelancer = activeContract?.freelancer_id || hiredProp?.freelancer_id;
    const hiredFreelancerName = activeContract?.freelancer_id?.name 
      || (typeof hiredFreelancer === 'object' ? hiredFreelancer?.name : null) 
      || hiredProp?.freelancer_name 
      || (activeContract ? 'Neelanjan V' : null);
    const hiredFreelancerAvatar = activeContract?.freelancer_id?.avatar 
      || activeContract?.freelancer_id?.profilePhoto 
      || (typeof hiredFreelancer === 'object' ? hiredFreelancer?.avatar : null) 
      || (hiredFreelancerName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(hiredFreelancerName)}&background=1a73e8&color=fff` : null);
    const hiredFreelancerTitle = activeContract?.freelancer_id?.title || 'Full Stack Developer';
    const hiredFreelancerRating = activeContract?.freelancer_id?.rating || 5.0;
    const hiredFreelancerLocation = activeContract?.freelancer_id?.location || 'India';
    const isHired = Boolean(activeContract || hiredFreelancerName || (activeWorkspace.status || '').toLowerCase() === 'in progress');
    const effectiveStatus = isHired ? (activeContract?.status || 'In Progress') : (activeWorkspace.status || 'Open');

    const completedMilestones = workspaceMilestones.filter(m => m.status === 'Paid' || m.status === 'Completed').length;
    const totalMilestonesCount = workspaceMilestones.length;
    const progressPercent = totalMilestonesCount > 0 ? Math.round((completedMilestones / totalMilestonesCount) * 100) : (effectiveStatus === 'Completed' ? 100 : 0);

    const totalBudgetAmount = Number(activeWorkspace.budget) || Number(activeContract?.totalValue) || 2500;
    const escrowFundedAmount = workspaceMilestones.filter(m => m.status === 'In Progress' || m.status === 'Paid' || m.status === 'Under Review').reduce((s, m) => s + (Number(m.amount) || 0), 0) || (isHired ? 1000 : 0);
    const escrowReleasedAmount = workspaceMilestones.filter(m => m.status === 'Paid' || m.status === 'Completed').reduce((s, m) => s + (Number(m.amount) || 0), 0);
    const escrowRemainingAmount = Math.max(0, totalBudgetAmount - escrowReleasedAmount);

    return (
      <div className="client-projects-page" style={{ animation: 'fadeIn 0.3s ease' }}>
        {/* Workspace Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <button 
              onClick={() => setActiveWorkspace(null)}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '6px 14px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginBottom: '12px', fontWeight: 700, fontSize: '0.8rem' }}
            >
              <ChevronLeft size={14} /> Back to My Projects
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{activeWorkspace.title}</h1>
              <StatusBadge status={effectiveStatus} />
              {activeWorkspace.category && (
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#e8f0fe', color: '#1a73e8', padding: '4px 12px', borderRadius: '20px' }}>
                  {activeWorkspace.category}
                </span>
              )}
              {isHired && hiredFreelancerName && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                  <UserCheck size={13} /> Hired: {hiredFreelancerName}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>GigSphere Project Workspace & Deliverable Control Hub</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => {
                const targetPartnerId = activeContract?.freelancer_id?._id || activeContract?.freelancer_id || activeWorkspace?.freelancer_id || activeWorkspace?.freelancer?.id;
                navigate('/client/dashboard/chat', {
                  state: {
                    partnerId: targetPartnerId,
                    name: hiredFreelancerName || activeWorkspace?.clientName,
                    avatar: hiredFreelancerAvatar,
                    title: activeWorkspace?.title
                  }
                });
              }}
              style={{ padding: '9px 18px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '30px', color: '#0f172a', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageCircle size={16} color="#1a73e8" /> Open Chat
            </button>
            <button 
              onClick={() => navigate('/client/dashboard/proposals')}
              style={{ padding: '9px 18px', background: '#1a73e8', border: 'none', borderRadius: '30px', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserCheck size={16} /> View Proposals ({activeWorkspace.proposals || 1})
            </button>
          </div>
        </div>

        {/* 4-Stat Workspace KPI Summary Strip */}
        <div className="grid-responsive-4" style={{ gap: '14px', marginBottom: '24px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Project Budget</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{formatINR(totalBudgetAmount)}</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Escrow Protection</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a73e8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={14} color="#1a73e8" /> 100% Protected ({formatINR(escrowFundedAmount)} locked)
            </span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Target Deadline</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{formatDeadline(activeContract?.deadline || activeWorkspace.deadline, activeWorkspace.duration)}</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Contract Progress</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#10b981', borderRadius: '10px', transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Workspace Nav Pills */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '10px', marginBottom: '24px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '📌 Project Overview' },
            { id: 'milestones', label: `🎯 Milestones & Escrow (${totalMilestonesCount})` },
            { id: 'files', label: '📁 Shared Deliverables & Assets' },
            { id: 'timeline', label: '📜 Activity Timeline' }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setWorkspaceTab(t.id)}
              style={{
                padding: '9px 18px',
                borderRadius: '30px',
                border: 'none',
                background: workspaceTab === t.id ? '#1a73e8' : '#f8fafc',
                color: workspaceTab === t.id ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {workspaceTab === 'overview' && (
          <div className="workspace-overview-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Assigned Freelancer & Milestone Spotlight Card */}
              {isHired && hiredFreelancerName && (
                <div style={{ background: '#ffffff', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 10px rgba(16, 185, 129, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img 
                        src={hiredFreelancerAvatar} 
                        alt={hiredFreelancerName} 
                        style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{hiredFreelancerName}</h4>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>
                            ✓ Assigned Pro
                          </span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                          {hiredFreelancerTitle} • ⭐ {Number(hiredFreelancerRating || 5).toFixed(1)} • {hiredFreelancerLocation}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          const targetPartnerId = activeContract?.freelancer_id?._id || activeContract?.freelancer_id;
                          navigate('/client/dashboard/chat', {
                            state: {
                              partnerId: targetPartnerId,
                              name: hiredFreelancerName,
                              avatar: hiredFreelancerAvatar,
                              title: activeWorkspace.title
                            }
                          });
                        }}
                        style={{ padding: '8px 16px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '24px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <MessageSquare size={14} /> Message
                      </button>
                      <button 
                        onClick={() => setWorkspaceTab('milestones')}
                        style={{ padding: '8px 16px', background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '24px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        View Milestones
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar inside card */}
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      <span>Deliverable Completion Progress</span>
                      <span style={{ color: '#10b981' }}>{progressPercent}% ({completedMilestones}/{totalMilestonesCount} Milestones Completed)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '10px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Project Requirements */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Project Summary & Requirements</h3>
                <p style={{ color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{activeWorkspace.description}</p>

                {activeWorkspace.skills && activeWorkspace.skills.length > 0 && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Required Skills & Expertise</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {activeWorkspace.skills.map(sk => (
                        <span key={sk} style={{ fontSize: '12px', fontWeight: 700, background: '#e8f0fe', color: '#1a73e8', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '14px' }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Client Notes Section */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Client Workspace Notes</h3>
                  {workspaceNotesSaved && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>✓ Saved!</span>}
                </div>
                <textarea 
                  rows={4}
                  placeholder="Keep private notes, credentials checklist, or project updates for your team here..."
                  value={workspaceNotes}
                  onChange={(e) => { setWorkspaceNotes(e.target.value); setWorkspaceNotesSaved(false); }}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
                <button 
                  onClick={() => {
                    const projId = activeWorkspace.id || activeWorkspace._id;
                    localStorage.setItem(`gigsphere_notes_${projId}`, workspaceNotes);
                    setWorkspaceNotesSaved(true);
                    setTimeout(() => setWorkspaceNotesSaved(false), 3000);
                  }}
                  style={{ marginTop: '10px', padding: '8px 18px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Save Notes
                </button>
              </div>
            </div>

            {/* Sidebar Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Escrow Payment Vault</h4>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Total Contract Budget:</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatINR(totalBudgetAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Locked in Escrow:</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>{formatINR(escrowFundedAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b' }}>Released to Date:</span>
                    <span style={{ fontWeight: 800, color: '#1a73e8' }}>{formatINR(escrowReleasedAmount)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setWorkspaceTab('milestones')}
                  style={{ width: '100%', padding: '9px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '30px', color: '#0f172a', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Manage Payments & Milestones
                </button>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Quick Workspace Actions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => { setSelectedProjectForMilestone(activeWorkspace); setIsMilestoneModalOpen(true); }} style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', color: '#0f172a' }}>+ Create New Milestone</button>
                  <button onClick={() => setWorkspaceTab('files')} style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', color: '#0f172a' }}>📁 Upload Deliverable Attachment</button>
                  {isHired && (
                    <button 
                      onClick={() => {
                        const targetPartnerId = activeContract?.freelancer_id?._id || activeContract?.freelancer_id;
                        navigate('/client/dashboard/chat', {
                          state: {
                            partnerId: targetPartnerId,
                            name: hiredFreelancerName,
                            avatar: hiredFreelancerAvatar,
                            title: activeWorkspace.title
                          }
                        });
                      }}
                      style={{ padding: '8px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', color: '#0f172a' }}
                    >
                      💬 Message Freelancer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MILESTONES & ESCROW */}
        {workspaceTab === 'milestones' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Project Milestones & Payment Escrow</h3>
                  <button 
                    onClick={() => setIsEscrowInfoModalOpen(true)}
                    style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Click to learn how Escrow, 10% Commission, and Milestones work"
                  >
                    <Info size={13} /> Escrow & Fee Guide
                  </button>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Escrow funds are held safely by GigSphere and only released upon your final approval.</p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setIsEscrowInfoModalOpen(true)}
                  style={{ padding: '8px 14px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '30px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <HelpCircle size={15} color="#1a73e8" /> What is Escrow?
                </button>
                <button 
                  onClick={() => { setSelectedProjectForMilestone(activeWorkspace); setIsMilestoneModalOpen(true); }}
                  style={{ padding: '8px 18px', background: '#1a73e8', color: '#ffffff', border: 'none', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Milestone
                </button>
              </div>
            </div>

            {workspaceMilestones.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '10px' }}>
                <Briefcase size={36} color="#94a3b8" style={{ marginBottom: '12px', display: 'inline-block' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  {isHired ? 'No Milestones Created Yet' : 'No Active Contract / Hired Freelancer'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.4' }}>
                  {isHired 
                    ? 'Click the "+ Add Milestone" button above to structure payment deliverables for this project.'
                    : 'No freelancer has been assigned to this project yet. Go to the Proposals tab of this project to review bids and hire a freelancer to start tracking escrow milestones!'}
                </p>
                {isHired && (
                  <button 
                    onClick={() => { setSelectedProjectForMilestone(activeWorkspace); setIsMilestoneModalOpen(true); }}
                    style={{ marginTop: '14px', padding: '8px 20px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    + Add First Milestone
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #cbd5e1', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px' }}>Milestone Phase</th>
                      <th style={{ padding: '12px' }}>Due Date</th>
                      <th style={{ padding: '12px' }}>Amount</th>
                      <th style={{ padding: '12px' }}>
                        <span 
                          onClick={() => setIsEscrowInfoModalOpen(true)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#1a73e8' }} 
                          title="Click to view Escrow Status definitions"
                        >
                          Escrow Status <Info size={13} />
                        </span>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspaceMilestones.map(m => {
                      const isCompleted = m.status === 'Paid' || m.status === 'Completed';
                      const isInProgress = m.status === 'In Progress';
                      const isUnderReview = m.status === 'Under Review';
                      const isPending = m.status === 'Pending';

                      const statusTooltip = isCompleted 
                        ? 'Payment Released: 90% credited to freelancer wallet (10% platform fee applied).'
                        : isInProgress 
                        ? 'In Progress: Advance payment is locked in Escrow. Freelancer is working.'
                        : isUnderReview 
                        ? 'Under Review: Freelancer submitted work deliverables. Click Release Escrow to approve.'
                        : 'Pending: Scheduled phase. Click "Fund Escrow" to lock advance deposit.';

                      return (
                        <tr key={m.id || m._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>{m.title}</td>
                          <td style={{ padding: '14px 12px', color: '#475569', fontSize: '0.85rem' }}>{m.dueDate}</td>
                          <td style={{ padding: '14px 12px', fontWeight: 800, color: '#10b981' }}>{formatINR(m.amount)}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <span 
                              onClick={() => setIsEscrowInfoModalOpen(true)}
                              title={statusTooltip}
                              style={{
                                fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                                background: isCompleted ? '#dcfce7' : (isInProgress ? '#e8f0fe' : (isUnderReview ? '#fef3c7' : '#f1f5f9')),
                                color: isCompleted ? '#15803d' : (isInProgress ? '#1a73e8' : (isUnderReview ? '#b45309' : '#64748b')),
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px'
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isCompleted ? '#16a34a' : (isInProgress ? '#2563eb' : (isUnderReview ? '#d97706' : '#94a3b8')) }} />
                              {m.status === 'Completed' ? 'Paid' : m.status}
                              <Info size={11} />
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                            {isInProgress || isUnderReview ? (
                              <button 
                                onClick={() => handleReleaseEscrow(m.id || m._id, m.amount)}
                                style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
                                title="Approve deliverable and release 90% payout to freelancer (10% fee deducted)"
                              >
                                Release Escrow
                              </button>
                            ) : isCompleted ? (
                              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>✓ Released</span>
                            ) : (
                              <button 
                                onClick={() => handleFundEscrow(m.id || m._id, m.amount)}
                                style={{ padding: '6px 14px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                                title="Lock advance funds into GigSphere Escrow to begin work"
                              >
                                Fund Escrow
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SHARED DELIVERABLES & ASSETS */}
        {workspaceTab === 'files' && (() => {
          const freelancerFiles = workspaceFiles.filter(f => f.uploadedBy === 'Freelancer');
          const clientFiles = workspaceFiles.filter(f => f.uploadedBy !== 'Freelancer');

          const renderFileCard = (f, originalIdx, accentColor) => (
            <div key={originalIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                {f.isDrive ? (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Folder size={22} color="#2563eb" />
                  </div>
                ) : f.isFigma ? (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Layers size={22} color="#7c3aed" />
                  </div>
                ) : f.isGithub ? (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GithubIcon size={22} color="#0f172a" />
                  </div>
                ) : f.isZip ? (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Archive size={22} color="#d97706" />
                  </div>
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileCheck size={22} color="#1a73e8" />
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{f.name}</h5>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ padding: '1px 6px', background: accentColor === 'green' ? '#dcfce7' : '#e0f2fe', color: accentColor === 'green' ? '#15803d' : '#0369a1', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                      {f.uploadedBy === 'Freelancer' || accentColor === 'green' ? 'Freelancer Upload' : 'Client Asset'}
                    </span>
                    • {f.size || (f.isGithub ? 'GitHub Repo' : (f.isZip ? 'ZIP Archive' : 'Project File'))}
                  </span>
                </div>
              </div>

              {f.url && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button 
                    onClick={() => { setPreviewFile(f); setIsMediaPreviewOpen(true); }} 
                    style={{ padding: '6px 12px', background: '#1a73e8', color: '#ffffff', border: 'none', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Preview In-App
                  </button>
                  {f.isGithub ? (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', background: '#24292f', color: '#ffffff', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} title="Open Repository on GitHub">
                      <ExternalLink size={13} /> GitHub
                    </a>
                  ) : (
                    <a href={f.url} download={f.name} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#475569', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }} title="Download File">
                      <Download size={13} /> {f.isZip ? 'ZIP' : ''}
                    </a>
                  )}
                  <button 
                    onClick={() => handleDeleteWorkspaceFile(originalIdx)}
                    style={{ padding: '6px 8px', background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remove Attachment"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );

          return (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Project Deliverables & Shared Assets</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Organized hub for freelancer-submitted work and client project specifications.</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsClientGithubModalOpen(true)}
                    style={{ padding: '8px 18px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                  >
                    <ExternalLink size={16} />
                    Share Link / Drive
                  </button>

                  <label style={{ padding: '8px 18px', background: '#1a73e8', color: '#ffffff', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={16} />
                    {isUploadingFile ? 'Uploading...' : 'Upload File / ZIP'}
                    <input type="file" accept=".zip,.rar,.7z,.tar,.gz,image/*,application/pdf,video/*" onChange={handleUploadWorkspaceFile} style={{ display: 'none' }} disabled={isUploadingFile} />
                  </label>
                </div>
              </div>

              {/* SECTION 1: FREELANCER SUBMITTED DELIVERABLES */}
              <div style={{ marginBottom: '28px', background: '#f8fafc', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '8px', height: '18px', background: '#10b981', borderRadius: '4px' }}></div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    🚀 Freelancer Submitted Deliverables & Submissions ({freelancerFiles.length})
                  </h4>
                </div>

                {freelancerFiles.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <Paperclip size={24} color="#94a3b8" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>No freelancer deliverables uploaded yet</p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Source code archives, GitHub repos, and completed PDFs submitted by the freelancer will appear here.</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    {freelancerFiles.map(f => {
                      const originalIdx = workspaceFiles.findIndex(item => item.url === f.url);
                      return renderFileCard(f, originalIdx, 'green');
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2: CLIENT SHARED PROJECT MATERIALS & SPECS */}
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '18px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ width: '8px', height: '18px', background: '#1a73e8', borderRadius: '4px' }}></div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    📁 Client Shared Project Specs & Materials ({clientFiles.length})
                  </h4>
                </div>

                {clientFiles.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    <Paperclip size={24} color="#94a3b8" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>No initial project specifications uploaded yet</p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Use "Upload File / ZIP" or "Share Link / Drive" above to upload requirements or design mockups for your project.</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                    {clientFiles.map(f => {
                      const originalIdx = workspaceFiles.findIndex(item => item.url === f.url);
                      return renderFileCard(f, originalIdx, 'blue');
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 4: ACTIVITY TIMELINE */}
        {workspaceTab === 'timeline' && (
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Real-time Project Audit Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e2e8f0' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                <h5 style={{ margin: '0 0 2px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Project Requirement Published</h5>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{activeWorkspace.postedDate || 'Today'} • Verified by GigSphere AI</span>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#1a73e8' }}></div>
                <h5 style={{ margin: '0 0 2px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Escrow Payment Vault Created</h5>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Protected under GigSphere Smart Escrow • Budget: {formatINR(totalBudgetAmount)}</span>
              </div>

              {isHired && (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }}></div>
                  <h5 style={{ margin: '0 0 2px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    Freelancer Hired: {hiredFreelancerName}
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Proposal accepted & contract initiated on {activeContract?.startDate ? new Date(activeContract.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>
              )}

              {workspaceMilestones.map((m, idx) => (
                <div key={m.id || m._id || idx} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%',
                    background: m.status === 'Paid' || m.status === 'Completed' ? '#10b981' : (m.status === 'In Progress' ? '#3b82f6' : '#94a3b8')
                  }}></div>
                  <h5 style={{ margin: '0 0 2px', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    {m.status === 'Paid' || m.status === 'Completed' ? '✓ Milestone Completed & Released' : (m.status === 'In Progress' ? '⚡ Milestone Active & In Progress' : '⏳ Milestone Scheduled')} — {m.title}
                  </h5>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Amount: {formatINR(m.amount)} • Target Due: {m.dueDate} • Status: {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Milestone Modal */}
        {isMilestoneModalOpen && selectedProjectForMilestone && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setIsMilestoneModalOpen(false)}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '440px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
              {isSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800 }}>Milestone Created!</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Added milestone for <strong>{selectedProjectForMilestone.title}</strong>.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Create Milestone</h3>
                      <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Set deliverable for {selectedProjectForMilestone.title}</p>
                    </div>
                    <button onClick={() => setIsMilestoneModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    setIsProcessing(true);
                    setTimeout(() => {
                      setIsProcessing(false);
                      setIsSuccess(true);
                      
                      const addedMilestone = {
                        id: Date.now(),
                        title: newMilestone.title,
                        amount: Number(newMilestone.amount),
                        status: 'Pending',
                        dueDate: new Date(newMilestone.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                      };
                      setWorkspaceMilestones(prev => [...prev, addedMilestone]);

                      setTimeout(() => {
                        setIsMilestoneModalOpen(false);
                        setIsSuccess(false);
                        setNewMilestone({ title: '', amount: '', date: '' });
                      }, 1500);
                    }, 500);
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Milestone Title *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Initial Prototype & Architecture" 
                        value={newMilestone?.title || ''} 
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                        required 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Amount (₹) *</label>
                        <input 
                          type="number" 
                          placeholder="5000" 
                          value={newMilestone?.amount || ''} 
                          onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Due Date *</label>
                        <input 
                          type="date" 
                          value={newMilestone?.date || ''} 
                          onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                          required 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button type="button" onClick={() => setIsMilestoneModalOpen(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" disabled={isProcessing} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#1a73e8', border: '1px solid #1a73e8', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                        {isProcessing ? 'Creating...' : 'Create Milestone'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Interactive Escrow & Commission Guide Modal */}
        {isEscrowInfoModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '1rem' }} onClick={() => setIsEscrowInfoModalOpen(false)}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '560px', width: '100%', padding: '2rem', color: '#0f172a', margin: 'auto', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={22} color="#1a73e8" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>GigSphere Escrow & Status Guide</h3>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Understanding milestone lifecycle, statuses & 10% fee</span>
                  </div>
                </div>
                <button onClick={() => setIsEscrowInfoModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              {/* 4 Statuses Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#e8f0fe', color: '#1a73e8' }}>🔵 In Progress</span>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Advance Funded in Escrow Vault</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>Client has funded the advance deposit for this phase into the secure GigSphere vault. The freelancer is actively working on the deliverables.</p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#fef3c7', color: '#b45309' }}>🟠 Under Review</span>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Work Submitted for Client Review</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>Freelancer has marked this milestone as completed and submitted deliverables. The client can inspect the work and click "Release Escrow" to pay.</p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#dcfce7', color: '#15803d' }}>🟢 Paid / Released</span>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Escrow Payout Completed</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>Client approved the deliverable. 90% net payout was transferred directly to the freelancer's wallet balance, and 10% platform fee was deducted.</p>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b' }}>⚪ Pending</span>
                    <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Scheduled Milestone</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>This phase is scheduled for later. Click "Fund Escrow" to lock advance deposit into the vault when ready to begin work.</p>
                </div>
              </div>

              {/* 10% Commission Box */}
              <div style={{ padding: '14px 16px', borderRadius: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 800, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={16} /> How is the 10% Platform Commission calculated?
                </h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.4 }}>
                  When a milestone is approved by the client:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
                  <li><strong>Client:</strong> Pays the exact agreed budget (e.g. ₹1,000). Zero hidden client fees.</li>
                  <li><strong>Freelancer:</strong> Receives <strong>90% net earnings</strong> (e.g. ₹900) credited to their wallet balance for instant bank/UPI withdrawal.</li>
                  <li><strong>GigSphere:</strong> Retains a flat <strong>10% service fee</strong> (e.g. ₹100) for payment protection and platform escrow guarantee.</li>
                </ul>
              </div>

              <button 
                onClick={() => setIsEscrowInfoModalOpen(false)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '30px', background: '#0f172a', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Got it, Close Guide
              </button>
            </div>
          </div>
        )}

        {/* Edit Project Popup Modal */}
        {isEditModalOpen && editingProject && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setIsEditModalOpen(false)}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '480px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justify: 'center' }}>
                    <Edit size={20} color="#1a73e8" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Edit Project Details</h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Update title, budget & deadline</span>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Project Title</label>
                  <input 
                    type="text" 
                    value={editingProject.title} 
                    onChange={(e) => setEditingProject({...editingProject, title: e.target.value})} 
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Budget (₹)</label>
                    <input 
                      type="number" 
                      value={editingProject.budget} 
                      onChange={(e) => setEditingProject({...editingProject, budget: e.target.value})} 
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Deadline Date</label>
                    <input 
                      type="date" 
                      value={editingProject.deadline} 
                      onChange={(e) => setEditingProject({...editingProject, deadline: e.target.value})} 
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Description</label>
                  <textarea 
                    value={editingProject.description} 
                    onChange={(e) => setEditingProject({...editingProject, description: e.target.value})} 
                    rows={3}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isSavingEdit} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#1a73e8', border: '1px solid #1a73e8', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Save size={14} />
                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-App Media & Document Preview Modal */}
        <MediaPreviewModal 
          isOpen={isMediaPreviewOpen} 
          onClose={() => setIsMediaPreviewOpen(false)} 
          file={previewFile} 
        />
      </div>
    );
  }

  return (
    <div className="client-projects-page">
      {/* Header */}
      <div className="client-projects-header">
        <div className="client-projects-breadcrumbs">
          <span>Dashboard</span>
          <ChevronRight size={14} className="client-projects-breadcrumb-icon" />
          <span className="active">My Projects</span>
        </div>
        <div className="client-projects-header-content">
          <div>
            <h1 className="client-projects-title">My Projects</h1>
            <p className="client-projects-description">Create, manage, and track all your posted project requirements from one workspace.</p>
          </div>
          <Link to="/client/dashboard/create-project" className="client-projects-create-btn">
            + Create Project
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="client-projects-stats-grid">
        <div className="client-projects-stat-card">
          <div className="client-projects-stat-header">
            <h3 className="client-projects-stat-label">Total Projects</h3>
            <div className="client-projects-stat-icon-container bg-gray">
              <LayoutTemplate size={16} className="client-projects-stat-icon text-gray" />
            </div>
          </div>
          <div className="client-projects-stat-value">{projects.length}</div>
        </div>
        <div className="client-projects-stat-card">
          <div className="client-projects-stat-accent-bar"></div>
          <div className="client-projects-stat-header">
            <h3 className="client-projects-stat-label">Active Projects</h3>
            <div className="client-projects-stat-icon-container bg-brand">
              <Briefcase size={16} className="client-projects-stat-icon text-brand" />
            </div>
          </div>
          <div className="client-projects-stat-value">{projects.filter(p => p.status === 'In Progress' || p.status === 'Open').length}</div>
        </div>
        <div className="client-projects-stat-card">
          <div className="client-projects-stat-header">
            <h3 className="client-projects-stat-label">Completed Projects</h3>
            <div className="client-projects-stat-icon-container bg-green">
              <FileText size={16} className="client-projects-stat-icon text-green" />
            </div>
          </div>
          <div className="client-projects-stat-value">{projects.filter(p => p.status === 'Completed').length}</div>
        </div>
        <div className="client-projects-stat-card">
          <div className="client-projects-stat-header">
            <h3 className="client-projects-stat-label">Total Spent</h3>
            <div className="client-projects-stat-icon-container bg-blue">
              <CreditCard size={16} className="client-projects-stat-icon text-blue" />
            </div>
          </div>
          <div className="client-projects-stat-value">{formatINR(projects.filter(p => p.status === 'Completed').reduce((sum, p) => sum + (p.budget || p.maxBudget || 0), 0))}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="client-projects-toolbar">
        <div className="client-projects-toolbar-top">
          <div className="client-projects-tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`client-projects-tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="client-projects-toolbar-bottom">
          <div className="client-projects-search">
            <Search size={16} className="client-projects-search-icon" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="client-projects-search-input"
            />
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="client-projects-empty-state">
           <div className="client-projects-empty-icon">
             <LayoutTemplate size={24} />
           </div>
           <h3 className="client-projects-empty-title">You haven't posted any projects yet</h3>
           <p className="client-projects-empty-desc">Create your first project and start receiving proposals from skilled freelancers.</p>
           <Link to="/client/dashboard/create-project" className="client-projects-create-btn">
             Create Your First Project
           </Link>
        </div>
      ) : (
        <div className="client-projects-grid" style={{ gap: '16px', marginTop: '20px' }}>
          {filteredProjects.map(project => (
            <div key={project.id || project._id} className="client-projects-card" style={{ padding: '18px 20px', borderRadius: '16px', border: '1px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <StatusBadge status={project.status} />
                  {project.category && (
                    <span style={{ fontSize: '11px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '20px' }}>
                      {project.category}
                    </span>
                  )}
                </div>
                
                <div className="client-projects-menu-container" style={{ position: 'relative' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === (project.id || project._id) ? null : (project.id || project._id));
                    }}
                    className="client-projects-menu-btn"
                    style={{ padding: '6px', borderRadius: '50%', color: '#64748b', cursor: 'pointer' }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menuOpen === (project.id || project._id) && (
                    <div className="client-projects-dropdown" style={{ position: 'absolute', right: 0, top: '32px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 99, minWidth: '150px', overflow: 'hidden' }}>
                      {getActions(project.status).map(action => (
                        <button 
                          key={action} 
                          className="client-projects-dropdown-item" 
                          onClick={(e) => handleActionClick(action, project, e)}
                          style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600, color: action === 'Delete' ? '#dc2626' : '#0f172a', cursor: 'pointer' }}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{project.title}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>
                  {project.description}
                </p>
              </div>

              {project.skills && project.skills.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {project.skills.map(skill => (
                    <span key={skill} style={{ fontSize: '11px', fontWeight: 700, background: '#f8fafc', color: '#1a73e8', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid-responsive-4" style={{ gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Budget</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#10b981' }}>{formatINR(project.budget || 0)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Proposals</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{project.proposals || 0} Bids</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Posted</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{project.postedDate || 'Today'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>Deadline</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a73e8' }}>{formatDeadline(project.deadline, project.duration)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                <button 
                  onClick={() => handleActionClick('Workspace', project)}
                  style={{ flex: 1, padding: '7px 14px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Briefcase size={14} /> View Workspace
                </button>
                <button 
                  onClick={() => handleActionClick('Milestones', project)}
                  style={{ flex: 1, padding: '7px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '30px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Add Milestone
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Project Popup Modal */}
      {isEditModalOpen && editingProject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setIsEditModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '480px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Edit size={20} color="#1a73e8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Edit Project Details</h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Update title, budget & deadline</span>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEditProject} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Project Title</label>
                <input 
                  type="text" 
                  value={editingProject.title} 
                  onChange={(e) => setEditingProject({...editingProject, title: e.target.value})} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Budget (₹)</label>
                  <input 
                    type="number" 
                    value={editingProject.budget} 
                    onChange={(e) => setEditingProject({...editingProject, budget: e.target.value})} 
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Deadline Date</label>
                  <input 
                    type="date" 
                    value={editingProject.deadline} 
                    onChange={(e) => setEditingProject({...editingProject, deadline: e.target.value})} 
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Description</label>
                <textarea 
                  value={editingProject.description} 
                  onChange={(e) => setEditingProject({...editingProject, description: e.target.value})} 
                  rows={3}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSavingEdit} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#1a73e8', border: '1px solid #1a73e8', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={14} />
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {isMilestoneModalOpen && selectedProjectForMilestone && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }} onClick={() => setIsMilestoneModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxWidth: '440px', width: '100%', padding: '1.75rem', color: '#0f172a', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {isSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800 }}>Milestone Created!</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Added milestone for <strong>{selectedProjectForMilestone.title}</strong>.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Create Milestone</h3>
                    <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Set deliverable for {selectedProjectForMilestone.title}</p>
                  </div>
                  <button onClick={() => setIsMilestoneModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justify: 'center', color: '#64748b', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  setIsProcessing(true);
                  setTimeout(() => {
                    setIsProcessing(false);
                    setIsSuccess(true);
                    
                    const addedMilestone = {
                      id: Date.now(),
                      title: newMilestone.title,
                      amount: Number(newMilestone.amount),
                      status: 'Pending',
                      dueDate: new Date(newMilestone.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                    };
                    setWorkspaceMilestones(prev => [...prev, addedMilestone]);

                    setTimeout(() => {
                      setIsMilestoneModalOpen(false);
                      setIsSuccess(false);
                      setNewMilestone({ title: '', amount: '', date: '' });
                    }, 1500);
                  }, 500);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Milestone Title *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Initial Prototype & Architecture" 
                      value={newMilestone?.title || ''} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Amount (₹) *</label>
                      <input 
                        type="number" 
                        placeholder="5000" 
                        value={newMilestone?.amount || ''} 
                        onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Due Date *</label>
                      <input 
                        type="date" 
                        value={newMilestone?.date || ''} 
                        onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button type="button" onClick={() => setIsMilestoneModalOpen(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={isProcessing} style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#1a73e8', border: '1px solid #1a73e8', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                      {isProcessing ? 'Creating...' : 'Create Milestone'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Client GitHub Share Modal */}
      {/* Client Share Link / Drive Modal */}
      {isClientGithubModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={() => setIsClientGithubModalOpen(false)}>
          <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxWidth: '520px', width: '100%', padding: '1.75rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ExternalLink size={20} color="#0f172a" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Share External Link / Drive</h3>
                  <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>Share Google Drive, Figma design, GitHub repo, or web links</p>
                </div>
              </div>
              <button onClick={() => setIsClientGithubModalOpen(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddClientExternalLink} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Resource Type / Platform *</label>
                <div className="grid-responsive-4" style={{ gap: '8px' }}>
                  {[
                    { id: 'drive', label: 'Google Drive', icon: <Folder size={18} /> },
                    { id: 'figma', label: 'Figma', icon: <Layers size={18} /> },
                    { id: 'github', label: 'GitHub', icon: <GithubIcon size={18} /> },
                    { id: 'link', label: 'Web Link', icon: <Globe size={18} /> }
                  ].map(cat => {
                    const isSelected = (clientGithubForm.category || 'drive') === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setClientGithubForm({ ...clientGithubForm, category: cat.id })}
                        style={{
                          padding: '0.65rem 0.4rem',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#f8fafc',
                          color: isSelected ? '#1d4ed8' : '#475569',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                  {clientGithubForm.category === 'figma' ? 'Figma Design URL *' : 
                   clientGithubForm.category === 'github' ? 'GitHub Repository URL *' : 
                   clientGithubForm.category === 'link' ? 'Web Link URL *' : 'Google Drive / Storage URL *'}
                </label>
                <input 
                  type="url" 
                  placeholder={
                    clientGithubForm.category === 'figma' ? 'https://www.figma.com/file/...' : 
                    clientGithubForm.category === 'github' ? 'https://github.com/organization/repo' : 
                    clientGithubForm.category === 'link' ? 'https://example.com/spec' : 'https://drive.google.com/drive/folders/...'
                  }
                  value={clientGithubForm.url} 
                  onChange={(e) => setClientGithubForm({ ...clientGithubForm, url: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Title / Display Name *</label>
                <input 
                  type="text" 
                  placeholder={
                    clientGithubForm.category === 'figma' ? 'e.g. Mobile UI Wireframes & Design System' : 
                    clientGithubForm.category === 'github' ? 'e.g. Starter Codebase & Technical Spec' : 
                    clientGithubForm.category === 'link' ? 'e.g. Project Documentation Wiki' : 'e.g. Project Raw Assets & Brand Folder'
                  }
                  value={clientGithubForm.title} 
                  onChange={(e) => setClientGithubForm({ ...clientGithubForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>Notes / Instructions (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Access permissions granted. Check README or drive folder for sub-materials."
                  value={clientGithubForm.description} 
                  onChange={(e) => setClientGithubForm({ ...clientGithubForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsClientGithubModalOpen(false)} style={{ padding: '0.65rem 1.25rem', borderRadius: '40px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.65rem 1.5rem', borderRadius: '40px', background: '#3b82f6', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={15} /> Attach Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Media & Document Preview Modal */}
      <MediaPreviewModal 
        isOpen={isMediaPreviewOpen} 
        onClose={() => setIsMediaPreviewOpen(false)} 
        file={previewFile} 
      />
    </div>
  );
}
