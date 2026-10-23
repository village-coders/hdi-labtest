import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Company, Sample, User } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Upload,
  Sparkles,
  Plus,
  Check,
  Building,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface SampleRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sample: Sample) => void;
  companies: Company[];
  onCompanyCreated: (company: Company) => void;
}

export const SampleRegistrationModal: React.FC<SampleRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companies,
  onCompanyCreated,
}) => {
  const { user } = useAuth();

  // Section A
  const [sampleName, setSampleName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [sampleNature, setSampleNature] = useState('Food / Beverage');
  const [pictureUrl, setPictureUrl] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState<string>('');

  // Sample Code Preview
  const [previewCode, setPreviewCode] = useState<string>('Auto-generating...');

  // Section B
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [nafdacNo, setNafdacNo] = useState('');

  // Section C
  const [dateOfEntry, setDateOfEntry] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([
    'Microbiological Analysis',
    'Proximate Analysis',
  ]);
  const [isOtherAnalysis, setIsOtherAnalysis] = useState(false);
  const [otherAnalysisText, setOtherAnalysisText] = useState('');
  const [receivingLabId, setReceivingLabId] = useState('LAB_1');
  const [sentBy, setSentBy] = useState(user?.name || 'Fatimah Aliyu (Registry Officer)');

  // Section D (Initial note / comments)
  const [initialComment, setInitialComment] = useState('');

  // Add Company inline state
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleNatureOptions = [
    'Food / Beverage',
    'Food / Dairy Products',
    'Food / Raw Material',
    'Food / Confectionery',
    'Non-Food / Cleaning Chemical',
    'Non-Food / Packaging Material',
    'Non-Food / Water & Effluent',
  ];

  const analysisOptions = [
    'Microbiological Analysis',
    'Proximate Analysis',
    'Heavy Metals Screen (Pb, Cd, As, Hg)',
    'Pesticide Residue Analysis',
    'Physicochemical Parameters',
    'Aflatoxin & Mycotoxins',
    'Nutritional Facts Panel',
    'Preservatives (Benzoate, Sorbate)',
    'ICUMSA Color Rating',
    'Water Quality & Potability',
  ];

  const labsList = [
    { id: 'LAB_1', name: 'Hydrochrom Analytical Services Limited' },
    { id: 'LAB_2', name: 'SAAG Chemical Nigeria Limited (SNCL)' },
    { id: 'LAB_3', name: 'Kazlat Public Analyst Laboratory' },
    { id: 'LAB_4', name: 'Central Halal Laboratory' },
  ];

  // Auto-preview sample code when dateOfEntry or sampleNature changes
  useEffect(() => {
    if (!isOpen) return;
    const fetchCode = async () => {
      try {
        const code = await api.getPreviewCode(dateOfEntry, sampleNature);
        setPreviewCode(code);
      } catch (e) {
        setPreviewCode('FD/10/26/Ext---');
      }
    };
    fetchCode();
  }, [dateOfEntry, sampleNature, isOpen]);

  // Set default company
  useEffect(() => {
    if (companies.length > 0 && !companyName) {
      setCompanyName(companies[0].name);
    }
  }, [companies, companyName]);

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPictureFile(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const handleToggleAnalysis = (item: string) => {
    if (selectedAnalyses.includes(item)) {
      setSelectedAnalyses(selectedAnalyses.filter((a) => a !== item));
    } else {
      setSelectedAnalyses([...selectedAnalyses, item]);
    }
  };

  const handleAddCompanySubmit = async () => {
    if (!newCompanyName.trim()) return;
    setIsAddingCompany(true);
    try {
      const created = await api.createCompany(newCompanyName.trim());
      onCompanyCreated(created);
      setCompanyName(created.name);
      setNewCompanyName('');
      setShowAddCompany(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add company');
    } finally {
      setIsAddingCompany(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const finalCompanyName = (showAddCompany ? newCompanyName : companyName).trim();

    if (!sampleName.trim()) {
      setErrorMsg('Sample Name is required');
      return;
    }
    if (!finalCompanyName) {
      setErrorMsg('Client Company Name is required');
      return;
    }

    // Assemble final analyses including custom "Others"
    const finalAnalyses = [...selectedAnalyses];
    if (isOtherAnalysis) {
      const customItems = otherAnalysisText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (customItems.length === 0 && finalAnalyses.length === 0) {
        setErrorMsg('Please specify the custom analysis in the "Others" field');
        return;
      }
      for (const item of customItems) {
        if (!finalAnalyses.includes(item)) {
          finalAnalyses.push(item);
        }
      }
    }

    if (finalAnalyses.length === 0) {
      setErrorMsg('Please select or specify at least one analysis required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-register company to the companies list if it is new
      const foundCompany = companies.find(
        (c) => c.name.toLowerCase() === finalCompanyName.toLowerCase()
      );
      if (!foundCompany) {
        try {
          const createdComp = await api.createCompany(finalCompanyName);
          if (onCompanyCreated) {
            onCompanyCreated(createdComp);
          }
        } catch (compErr) {
          console.warn('Company auto-creation noted:', compErr);
        }
      }

      let uploadedPicUrl = pictureUrl;
      if (pictureFile) {
        const uploadRes = await api.uploadFile(pictureFile);
        uploadedPicUrl = uploadRes.fileUrl;
      } else if (!uploadedPicUrl) {
        uploadedPicUrl =
          sampleNature.startsWith('Food')
            ? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
            : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';
      }

      let uploadedDocUrl: string | undefined = undefined;
      if (docFile) {
        const docUploadRes = await api.uploadFile(docFile);
        uploadedDocUrl = docUploadRes.fileUrl;
      }

      const chosenLab = labsList.find((l) => l.id === receivingLabId);

      const created = await api.createSample({
        sampleName: sampleName.trim(),
        companyName: finalCompanyName,
        sampleNature,
        pictureUrl: uploadedPicUrl,
        attachmentUrl: uploadedDocUrl,
        productionDate: productionDate || undefined,
        expiryDate: expiryDate || undefined,
        batchNo: batchNo.trim(),
        nafdacNo: nafdacNo.trim(),
        dateOfEntry,
        analysisRequired: finalAnalyses,
        receivingLabId,
        receivingLabName: chosenLab?.name || 'Standard Analytical Laboratories',
        sentBy: sentBy || user?.name || 'Registry Officer',
      });

      // If initial note provided, add comment
      if (initialComment.trim()) {
        await api.addComment(created._id, initialComment.trim());
      }

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register sample');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sample Registration & Dispatch Form"
      subtitle="Complete Sections A through D to register and dispatch sample to external laboratory"
      maxWidth="860px"
    >
      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '13px',
              marginBottom: 20,
            }}
          >
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* Section A: Sample Information */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#2563eb',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              A
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Section A: Sample Information
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 1. Sample Name */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Sample Name <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Fortified Wheat Flour 50kg or Energy Drink 330ml"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                required
              />
            </div>

            {/* 2. Company Name Dropdown + Add / Type New */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Client Company Name <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCompany(!showAddCompany);
                    if (!showAddCompany) {
                      setNewCompanyName('');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 4px',
                  }}
                >
                  <Plus size={13} /> {showAddCompany ? '← Choose from Existing List' : '+ Add New Company'}
                </button>
              </div>

              {showAddCompany ? (
                <div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type client company name (e.g. Flour Mills of Nigeria Plc)..."
                      value={newCompanyName}
                      onChange={(e) => {
                        setNewCompanyName(e.target.value);
                        setCompanyName(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCompanySubmit();
                        }
                      }}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={handleAddCompanySubmit}
                      disabled={isAddingCompany || !newCompanyName.trim()}
                      className="btn btn-primary btn-sm"
                      style={{ background: '#0f172a', whiteSpace: 'nowrap' }}
                      title="Save company immediately to directory"
                    >
                      {isAddingCompany ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCompany(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: '#16a34a', marginTop: 4, display: 'block' }}>
                    ✓ Company will be registered and saved to the Client Companies directory.
                  </span>
                </div>
              ) : (
                <select
                  className="form-select"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                >
                  <option value="">Select Registered Client Company...</option>
                  {companies.map((c) => (
                    <option key={c._id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Sample Code Preview (Auto-generated) */}
            <div className="form-group">
              <label className="form-label">
                Sample Code <span style={{ fontSize: '11px', color: '#16a34a' }}>(Auto-Generated)</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#1e293b',
                }}
              >
                <Sparkles size={16} color="#2563eb" />
                <span>{previewCode}</span>
              </div>
            </div>

            {/* 4. Sample Nature */}
            <div className="form-group">
              <label className="form-label">
                Sample Nature <span className="required-star">*</span>
              </label>
              <select
                className="form-select"
                value={sampleNature}
                onChange={(e) => setSampleNature(e.target.value)}
                required
              >
                {sampleNatureOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. File Upload Section: Picture of Sample */}
            <div className="form-group">
              <label className="form-label">
                Picture / Photo of Sample <span className="required-star">*</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>(JPG/PNG)</span>
              </label>
              <div
                style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handlePictureChange}
                  style={{ fontSize: '12px', flex: 1 }}
                />
                {picturePreview && (
                  <img
                    src={picturePreview}
                    alt="Sample Preview"
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }}
                  />
                )}
              </div>
            </div>

            {/* 6. File Upload Section: Product Specification / Lab Sheet */}
            <div className="form-group">
              <label className="form-label">
                Product Specification / Lab Document
                <span style={{ fontSize: '11px', color: '#64748b' }}>(PDF, DOCX, XLSX - Optional)</span>
              </label>
              <div
                style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files ? e.target.files[0] : null;
                    setDocFile(f);
                    setDocName(f ? f.name : '');
                  }}
                  style={{ fontSize: '12px', flex: 1 }}
                />
                {docName && (
                  <span
                    style={{
                      fontSize: '11px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ✓ {docName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section B: Product Details */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#475569',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              B
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Section B: Product Details
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {/* 6. Production Date */}
            <div className="form-group">
              <label className="form-label">Production Date</label>
              <input
                type="date"
                className="form-input"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
              />
            </div>

            {/* 7. Expiry Date */}
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input
                type="date"
                className="form-input"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            {/* 8. Batch No */}
            <div className="form-group">
              <label className="form-label">Batch No.</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. BATCH-2026-X1"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
              />
            </div>

            {/* 9. NAFDAC No */}
            <div className="form-group">
              <label className="form-label">NAFDAC No.</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. A1-0492"
                value={nafdacNo}
                onChange={(e) => setNafdacNo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section C: Receipt & Dispatch Tracking */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#2563eb',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              C
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Section C: Receipt &amp; Dispatch Tracking
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 10. Date of Entry */}
            <div className="form-group">
              <label className="form-label">
                Date of Entry <span className="required-star">*</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={dateOfEntry}
                onChange={(e) => setDateOfEntry(e.target.value)}
                required
              />
            </div>

            {/* 12. Receiving Lab */}
            <div className="form-group">
              <label className="form-label">
                Receiving Lab <span className="required-star">*</span>
              </label>
              <select
                className="form-select"
                value={receivingLabId}
                onChange={(e) => setReceivingLabId(e.target.value)}
                required
              >
                {labsList.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name} ({lab.id})
                  </option>
                ))}
              </select>
            </div>

            {/* 14. Sent By */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Sent By (Registry Officer) <span className="required-star">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={sentBy}
                onChange={(e) => setSentBy(e.target.value)}
                required
              />
            </div>

            {/* 11. Analysis to be Carried Out (Multi-select + Others) */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Analysis to be Carried Out <span className="required-star">*</span>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 6 }}>
                  ({selectedAnalyses.length + (isOtherAnalysis && otherAnalysisText.trim() ? 1 : 0)} selected)
                </span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 8,
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: 190,
                  overflowY: 'auto',
                }}
              >
                {analysisOptions.map((analysis) => {
                  const isChecked = selectedAnalyses.includes(analysis);
                  return (
                    <label
                      key={analysis}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        borderRadius: 4,
                        background: isChecked ? '#eff6ff' : 'transparent',
                        color: isChecked ? '#1d4ed8' : '#334155',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAnalysis(analysis)}
                      />
                      <span>{analysis}</span>
                    </label>
                  );
                })}

                {/* Option of Others */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: 4,
                    background: isOtherAnalysis ? '#f8fafc' : '#ffffff',
                    color: isOtherAnalysis ? '#0f172a' : '#1e293b',
                    fontWeight: 700,
                    border: isOtherAnalysis ? '1.5px solid #0f172a' : '1px dashed #cbd5e1',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isOtherAnalysis}
                    onChange={(e) => setIsOtherAnalysis(e.target.checked)}
                  />
                  <span>➕ Others (Type Custom Analysis)</span>
                </label>
              </div>

              {/* Custom Analysis Text Input Field */}
              {isOtherAnalysis && (
                <div
                  style={{
                    marginTop: 10,
                    padding: '12px 14px',
                    background: '#f0fdf4',
                    border: '1.5px solid #16a34a',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Type Specific Analysis Required:</span>
                    <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Porcine DNA PCR Test, Ethanol / Alcohol Assay, Gelatin Origin Analysis..."
                    value={otherAnalysisText}
                    onChange={(e) => setOtherAnalysisText(e.target.value)}
                    style={{ fontSize: '13px', background: '#ffffff', borderColor: '#86efac' }}
                    autoFocus
                  />
                  <span style={{ fontSize: '11px', color: '#15803d' }}>
                    💡 Enter the custom test parameter or multiple items separated by commas.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section D: Notes / Initial Instructions */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#475569',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              D
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Section D: Initial Notes &amp; Dispatch Instructions
            </h3>
          </div>

          <div className="form-group">
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Add optional notes or specific analytical instructions for the receiving laboratory..."
              value={initialComment}
              onChange={(e) => setInitialComment(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <Check size={16} />
            {isSubmitting ? 'Registering & Dispatching...' : 'Register & Dispatch Sample'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
