import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Company, Sample } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Sparkles,
  Plus,
  Check,
  AlertCircle,
  X,
  Tag,
  MapPin,
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

  // Section A: Sample Information
  const [sampleName, setSampleName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [sampleNature, setSampleNature] = useState('Food - Solid');
  const [pictureUrl, setPictureUrl] = useState('');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string>('');

  // Sample Code (Typeable & Editable with Auto-generation)
  const [sampleCode, setSampleCode] = useState<string>('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState<boolean>(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);

  // Section B: Product Details (Completely Optional)
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Dynamic Product Identifier Fields
  const [selectedProductFields, setSelectedProductFields] = useState<string[]>([]);
  const [batchNo, setBatchNo] = useState('');
  const [nafdacNo, setNafdacNo] = useState('');
  const [sonNo, setSonNo] = useState('');
  const [isoNo, setIsoNo] = useState('');
  const [barcodeNo, setBarcodeNo] = useState('');
  const [otherIdentifier, setOtherIdentifier] = useState('');

  // Section C: Receipt & Dispatch Tracking
  const [dateOfEntry, setDateOfEntry] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([
    'Microbiological Analysis',
    'Proximate Analysis',
  ]);
  const [isOtherAnalysis, setIsOtherAnalysis] = useState(false);
  const [otherAnalysisText, setOtherAnalysisText] = useState('');
  const [receivingLabId, setReceivingLabId] = useState('LAB_1');
  const [sentBy, setSentBy] = useState(user?.name || 'Fatimah Aliyu (Registry Officer)');

  // Section D: Notes / Initial Instructions
  const [initialComment, setInitialComment] = useState('');

  // Add Company inline state
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleNatureOptions = [
    'Food - Solid',
    'Food - Liquid',
    'Food - Semi-Solid',
    'Non-Food - Solid',
    'Non-Food - Liquid',
    'Non-Food - Semi-Solid',
  ];

  const analysisOptions = [
    'Microbiological Analysis',
    'Proximate Analysis',
    'Vitamins Analysis (Vitamin A, B-Group, C, D, E)',
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

  // Dynamic Product Identifier Definitions
  const identifierDefinitions = [
    {
      key: 'batchNo',
      label: 'Batch Number',
      shortLabel: 'Batch No.',
      placeholder: 'e.g. BATCH-2026-X1',
      value: batchNo,
      setter: setBatchNo,
    },
    {
      key: 'nafdacNo',
      label: 'NAFDAC Registration No.',
      shortLabel: 'NAFDAC Reg. No.',
      placeholder: 'e.g. A1-0492 or 01-1234',
      value: nafdacNo,
      setter: setNafdacNo,
    },
    {
      key: 'sonNo',
      label: 'SON / MANCAP Certification No.',
      shortLabel: 'SON / MANCAP No.',
      placeholder: 'e.g. SON/MANCAP/2026/088',
      value: sonNo,
      setter: setSonNo,
    },
    {
      key: 'isoNo',
      label: 'ISO Standard / Certification No.',
      shortLabel: 'ISO Certification No.',
      placeholder: 'e.g. ISO 22000:2018 / ISO 9001:2015',
      value: isoNo,
      setter: setIsoNo,
    },
    {
      key: 'barcodeNo',
      label: 'Barcode / EAN / UPC',
      shortLabel: 'Barcode / UPC',
      placeholder: 'e.g. 6151234567890',
      value: barcodeNo,
      setter: setBarcodeNo,
    },
    {
      key: 'otherIdentifier',
      label: 'Other Regulatory / Cert. No.',
      shortLabel: 'Other Reg. / Cert No.',
      placeholder: 'e.g. Factory License / Halal Certificate Ref',
      value: otherIdentifier,
      setter: setOtherIdentifier,
    },
  ];

  // Auto-generate code when dateOfEntry or sampleNature changes (unless user manually modified)
  const fetchGeneratedCode = async (force: boolean = false) => {
    if (!force && isCodeManuallyEdited) return;
    setIsGeneratingCode(true);
    try {
      const code = await api.getPreviewCode(dateOfEntry, sampleNature);
      setSampleCode(code);
    } catch (e) {
      // Fallback format: [Prefix]/[Month][Year]/Ext--- (No stroke between month and year)
      const d = new Date(dateOfEntry || new Date());
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const prefix =
        sampleNature.startsWith('Food')
          ? 'FD'
          : 'NF';
      setSampleCode(`${prefix}/${mm}${yy}/Ext---`);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchGeneratedCode(false);
  }, [dateOfEntry, sampleNature, isOpen]);

  // Set default company & pre-populate address if available
  useEffect(() => {
    if (companies.length > 0 && !companyName) {
      setCompanyName(companies[0].name);
      if (companies[0].address) {
        setCompanyAddress(companies[0].address);
      }
    }
  }, [companies, companyName]);

  const handleCompanyChange = (selectedName: string) => {
    setCompanyName(selectedName);
    const matched = companies.find((c) => c.name.toLowerCase() === selectedName.toLowerCase());
    if (matched && matched.address) {
      setCompanyAddress(matched.address);
    }
  };

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

  const handleSelectProductField = (fieldKey: string) => {
    if (!fieldKey) return;
    if (!selectedProductFields.includes(fieldKey)) {
      setSelectedProductFields([...selectedProductFields, fieldKey]);
    }
  };

  const handleRemoveProductField = (fieldKey: string) => {
    setSelectedProductFields(selectedProductFields.filter((k) => k !== fieldKey));
    // Clear value of removed field
    const def = identifierDefinitions.find((d) => d.key === fieldKey);
    if (def) {
      def.setter('');
    }
  };

  const handleAddCompanySubmit = async () => {
    if (!newCompanyName.trim()) return;
    setIsAddingCompany(true);
    try {
      const created = await api.createCompany(
        newCompanyName.trim(),
        'Lead QA Officer',
        `qa@${newCompanyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.ng`,
        '+234 800 000 0000',
        companyAddress.trim() || undefined
      );
      onCompanyCreated(created);
      setCompanyName(created.name);
      if (created.address) {
        setCompanyAddress(created.address);
      }
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
    if (!sampleCode.trim()) {
      setErrorMsg('Sample Code is required');
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
      // Auto-register company to directory if new
      const foundCompany = companies.find(
        (c) => c.name.toLowerCase() === finalCompanyName.toLowerCase()
      );
      if (!foundCompany) {
        try {
          const createdComp = await api.createCompany(
            finalCompanyName,
            'Lead QA Officer',
            `qa@${finalCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.ng`,
            '+234 800 000 0000',
            companyAddress.trim() || undefined
          );
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
        uploadedPicUrl = sampleNature.startsWith('Food')
          ? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';
      }

      const chosenLab = labsList.find((l) => l.id === receivingLabId);

      const created = await api.createSample({
        sampleName: sampleName.trim(),
        companyName: finalCompanyName,
        companyAddress: companyAddress.trim() || undefined,
        sampleCode: sampleCode.trim(),
        sampleNature,
        pictureUrl: uploadedPicUrl,
        productionDate: productionDate || undefined,
        expiryDate: expiryDate || undefined,
        batchNo: batchNo.trim() || undefined,
        nafdacNo: nafdacNo.trim() || undefined,
        sonNo: sonNo.trim() || undefined,
        isoNo: isoNo.trim() || undefined,
        barcodeNo: barcodeNo.trim() || undefined,
        otherIdentifier: otherIdentifier.trim() || undefined,
        dateOfEntry,
        analysisRequired: finalAnalyses,
        receivingLabId,
        receivingLabName: chosenLab?.name || 'Standard Analytical Laboratories',
        sentBy: sentBy || user?.name || 'Registry Officer',
        isDirectSample: false,
        isHistorical: false,
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
      subtitle="Complete Section A (Section B Product Details is optional) to register and dispatch sample"
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

        {/* ════════ Section A: Sample Information ════════ */}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
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
                  onChange={(e) => handleCompanyChange(e.target.value)}
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

            {/* 3. Company Address */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} color="#64748b" />
                <span>Company Address</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Plot 12, Commercial Avenue, Ikeja Industrial Estate, Lagos"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
              />
            </div>

            {/* 4. Sample Code (Typeable & Editable Auto-generation) */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Sample Code <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCodeManuallyEdited(false);
                    fetchGeneratedCode(true);
                  }}
                  disabled={isGeneratingCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 4px',
                  }}
                  title="Regenerate sequential code based on date and category"
                >
                  <Sparkles size={12} /> {isGeneratingCode ? 'Generating...' : 'Regenerate Code'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={sampleCode}
                  onChange={(e) => {
                    setSampleCode(e.target.value);
                    setIsCodeManuallyEdited(true);
                  }}
                  placeholder="e.g. FD/1026/Ext001"
                  required
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#0f172a',
                    paddingLeft: '34px',
                    letterSpacing: '0.4px',
                  }}
                />
                <Sparkles
                  size={15}
                  color="#2563eb"
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
              </div>

            </div>

            {/* 5. Sample Nature */}
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

            {/* 6. Picture of Sample */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Picture / Photo of Sample <span className="required-star">*</span>
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 6 }}>(JPG/PNG)</span>
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
          </div>
        </div>

        {/* ════════ Section B: Product Details (Completely Optional) ════════ */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#64748b',
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
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Section B: Product Details
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  Optional manufacturing dates and product identifiers (NAFDAC, Batch No, SON, ISO, Barcode, etc.)
                </span>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 999,
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: 600,
              }}
            >
              Optional Section
            </span>
          </div>

          {/* Manufacturing & Expiry Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">
                Production Date <span style={{ fontSize: '11px', color: '#94a34b' }}>(Optional)</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Expiry Date <span style={{ fontSize: '11px', color: '#94a34b' }}>(Optional)</span>
              </label>
              <input
                type="date"
                className="form-input"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Dynamic Product Identifier Dropdown & Selector */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Tag size={14} color="#2563eb" />
                <span style={{ fontWeight: 700 }}>Select Product Identifiers / Certifications:</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                  (Pick any identifier to display its input box — not compulsory)
                </span>
              </label>

              {/* Dropdown selector */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ maxWidth: 380, fontSize: '13px', background: '#ffffff' }}
                  value=""
                  onChange={(e) => {
                    handleSelectProductField(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">+ Add Product Detail / Identifier (NAFDAC, Batch, SON, ISO...)</option>
                  {identifierDefinitions.map((def) => {
                    const isPicked = selectedProductFields.includes(def.key);
                    return (
                      <option key={def.key} value={def.key} disabled={isPicked}>
                        {isPicked ? `✓ ${def.label} (Added)` : `+ ${def.label}`}
                      </option>
                    );
                  })}
                </select>

                {/* Quick Add Pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {identifierDefinitions.map((def) => {
                    const isPicked = selectedProductFields.includes(def.key);
                    return (
                      <button
                        key={def.key}
                        type="button"
                        onClick={() => {
                          if (isPicked) {
                            handleRemoveProductField(def.key);
                          } else {
                            handleSelectProductField(def.key);
                          }
                        }}
                        style={{
                          fontSize: '11.5px',
                          padding: '4px 9px',
                          borderRadius: 6,
                          border: isPicked ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: isPicked ? '#eff6ff' : '#ffffff',
                          color: isPicked ? '#1d4ed8' : '#475569',
                          fontWeight: isPicked ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isPicked ? <Check size={12} /> : <Plus size={12} />}
                        {def.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dynamic Input Boxes for Picked Identifiers */}
            {selectedProductFields.length > 0 ? (
              <div
                style={{
                  marginTop: 14,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                  gap: 12,
                  paddingTop: 12,
                  borderTop: '1px dashed #cbd5e1',
                }}
              >
                {selectedProductFields.map((fieldKey) => {
                  const def = identifierDefinitions.find((d) => d.key === fieldKey);
                  if (!def) return null;
                  return (
                    <div
                      key={def.key}
                      style={{
                        padding: '10px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <label
                          className="form-label"
                          style={{
                            marginBottom: 0,
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#1e293b',
                          }}
                        >
                          {def.label}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveProductField(def.key)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: '11px',
                          }}
                          title={`Remove ${def.shortLabel} field`}
                        >
                          <X size={13} />
                          <span>Remove</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={def.placeholder}
                        value={def.value}
                        onChange={(e) => def.setter(e.target.value)}
                        style={{ fontSize: '13px' }}
                        autoFocus
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  marginTop: 8,
                  fontSize: '11.5px',
                  color: '#64748b',
                  fontStyle: 'italic',
                }}
              >
                No product identifier picked. Use the dropdown or pills above to add fields (e.g. NAFDAC No., Batch No., SON, ISO...).
              </div>
            )}
          </div>
        </div>

        {/* ════════ Section C: Receipt & Dispatch Tracking ════════ */}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
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

            {/* 11. Receiving Lab */}
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

            {/* 12. Sent By */}
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

            {/* 13. Analysis to be Carried Out (Multi-select + Others) */}
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: 8,
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  maxHeight: 200,
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
                        fontWeight: isChecked ? 600 : 400,
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
                  <label
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
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

        {/* ════════ Section D: Notes / Initial Instructions ════════ */}
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
            flexWrap: 'wrap',
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
