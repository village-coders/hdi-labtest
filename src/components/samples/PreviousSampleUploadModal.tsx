import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Company, Sample } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import * as XLSX from 'xlsx';
import {
  History,
  FileSpreadsheet,
  Upload,
  Sparkles,
  Plus,
  Check,
  AlertCircle,
  FileText,
  Building,
  Calendar,
  CheckCircle2,
  Download,
  Trash2,
  MapPin,
  Tag,
} from 'lucide-react';

interface PreviousSampleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sample?: Sample) => void;
  companies: Company[];
  onCompanyCreated: (company: Company) => void;
}

export const PreviousSampleUploadModal: React.FC<PreviousSampleUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companies,
  onCompanyCreated,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'form' | 'spreadsheet'>('form');

  // ═════════════════ FORM MODE STATE ═════════════════
  const [sampleName, setSampleName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [sampleCode, setSampleCode] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [sampleNature, setSampleNature] = useState('Food - Solid');
  const [dateOfEntry, setDateOfEntry] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default to 1 month ago
  );
  const [receivingLabId, setReceivingLabId] = useState('LAB_1');
  const [workflowStatus, setWorkflowStatus] = useState<string>('Closed');
  const [resultStatus, setResultStatus] = useState<string>('Completed');
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([
    'Microbiological Analysis',
    'Proximate Analysis',
  ]);
  const [isOtherAnalysis, setIsOtherAnalysis] = useState(false);
  const [otherAnalysisText, setOtherAnalysisText] = useState('');
  const [resultComments, setResultComments] = useState('Compliant with Halal analytical standards.');
  const [sentBy, setSentBy] = useState(user?.name || 'Registry Officer');

  // Certificate / Result File upload
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certFileName, setCertFileName] = useState('');
  const [samplePhoto, setSamplePhoto] = useState<File | null>(null);

  // Optional Product Details
  const [batchNo, setBatchNo] = useState('');
  const [nafdacNo, setNafdacNo] = useState('');
  const [sonNo, setSonNo] = useState('');
  const [isoNo, setIsoNo] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Optional Billing
  const [invoiceNo, setInvoiceNo] = useState('');
  const [receiptNo, setReceiptNo] = useState('');

  // Suppress emails toggle (checked by default for historical uploads)
  const [suppressEmails, setSuppressEmails] = useState(true);

  // Add Company inline state
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  // ═════════════════ SPREADSHEET MODE STATE ═════════════════
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  // Auto-generate sample code for the historical date
  useEffect(() => {
    if (!isOpen || isCodeManuallyEdited) return;
    const genCode = async () => {
      try {
        const code = await api.getPreviewCode(dateOfEntry, sampleNature);
        setSampleCode(code);
      } catch (e) {
        const d = new Date(dateOfEntry || new Date());
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const prefix = sampleNature.startsWith('Food') ? 'FD' : 'NF';
        setSampleCode(`${prefix}/${mm}${yy}/Ext---`);
      }
    };
    genCode();
  }, [dateOfEntry, sampleNature, isOpen, isCodeManuallyEdited]);

  // Set default company & address
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

  // ═════════════════ SPREADSHEET PARSER ═════════════════
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          setParseError('The uploaded file does not contain any data rows.');
          setParsedRows([]);
          return;
        }

        // Map and validate columns
        const mapped = data.map((row, idx) => {
          const sName =
            row['Sample Name'] ||
            row['sampleName'] ||
            row['Sample'] ||
            row['Product Name'] ||
            `Historical Sample #${idx + 1}`;
          const cName =
            row['Company Name'] ||
            row['companyName'] ||
            row['Company'] ||
            row['Client'] ||
            'Historical Client Company';
          const cAddr = row['Company Address'] || row['companyAddress'] || row['Address'] || '';
          const sCode = row['Sample Code'] || row['sampleCode'] || row['Code'] || '';
          const sNature = row['Sample Nature'] || row['Nature'] || row['Category'] || 'Food - Solid';

          let dEntry = row['Date of Entry'] || row['Date'] || row['Registration Date'] || '';
          if (dEntry instanceof Date) {
            dEntry = dEntry.toISOString().split('T')[0];
          } else if (dEntry && !isNaN(Date.parse(dEntry))) {
            dEntry = new Date(dEntry).toISOString().split('T')[0];
          } else {
            dEntry = new Date().toISOString().split('T')[0];
          }

          const lab = row['Receiving Lab'] || row['Lab'] || 'Hydrochrom Analytical Services Limited';
          let labId = 'LAB_1';
          if (String(lab).toLowerCase().includes('saag')) labId = 'LAB_2';
          else if (String(lab).toLowerCase().includes('kazlat')) labId = 'LAB_3';
          else if (String(lab).toLowerCase().includes('central') || String(lab).toLowerCase().includes('halal')) labId = 'LAB_4';

          const wStatus = row['Workflow Status'] || row['Status'] || 'Closed';
          const rStatus = row['Result Status'] || (wStatus === 'Closed' || wStatus === 'Result Received' ? 'Completed' : 'Pending');
          const an = row['Analysis Required'] || row['Analysis'] || 'Microbiological Analysis, Proximate Analysis';
          const bNo = row['Batch No'] || row['Batch'] || '';
          const nNo = row['NAFDAC No'] || row['NAFDAC'] || '';
          const rComm = row['Result Summary'] || row['Remarks'] || row['Findings'] || 'Historical sample record.';

          return {
            sampleName: String(sName).trim(),
            companyName: String(cName).trim(),
            companyAddress: String(cAddr).trim(),
            sampleCode: String(sCode).trim(),
            sampleNature: String(sNature).trim(),
            dateOfEntry: dEntry,
            receivingLabId: labId,
            receivingLabName: String(lab).trim() || 'Standard Analytical Laboratories',
            analysisRequired: String(an).split(/[,;]/).map((s) => s.trim()).filter(Boolean),
            workflowStatus: String(wStatus).trim(),
            resultStatus: String(rStatus).trim(),
            batchNo: String(bNo).trim(),
            nafdacNo: String(nNo).trim(),
            resultComments: String(rComm).trim(),
            sentBy: user?.name || 'Registry Officer',
            isHistorical: true,
          };
        });

        setParsedRows(mapped);
      } catch (err: any) {
        setParseError(`Failed to parse file: ${err.message || 'Invalid spreadsheet'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Sample Name': 'Fortified Wheat Flour 50kg',
        'Company Name': 'Crown Flour Mills Limited',
        'Company Address': 'Plot 4, Commercial Road, Apapa, Lagos',
        'Sample Code': 'FD/0825/Ext001',
        'Sample Nature': 'Food - Solid',
        'Date of Entry': '2025-08-15',
        'Receiving Lab': 'Hydrochrom Analytical Services Limited',
        'Analysis Required': 'Microbiological Analysis, Proximate Analysis, Heavy Metals Screen',
        'Workflow Status': 'Closed',
        'Result Status': 'Completed',
        'Batch No': 'BATCH-CFM-2025-08',
        'NAFDAC No': '01-4492',
        'Result Summary': 'Full compliance with Halal quality criteria. Passed.',
      },
      {
        'Sample Name': 'Carbonated Apple Drink 330ml',
        'Company Name': 'Seven-Up Bottling Company Plc',
        'Company Address': '247 Moshood Abiola Way, Ijora, Lagos',
        'Sample Code': 'FD/0925/Ext002',
        'Sample Nature': 'Food - Liquid',
        'Date of Entry': '2025-09-10',
        'Receiving Lab': 'SAAG Chemical Nigeria Limited (SNCL)',
        'Analysis Required': 'Preservatives (Benzoate, Sorbate), Physicochemical Parameters',
        'Workflow Status': 'Closed',
        'Result Status': 'Completed',
        'Batch No': 'BATCH-SBC-9921',
        'NAFDAC No': '01-8891',
        'Result Summary': 'Parameters within standard specification limits.',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PreviousSamplesTemplate');
    XLSX.writeFile(wb, 'HDI_Previous_Samples_Import_Template.xlsx');
  };

  // ═════════════════ SUBMISSIONS ═════════════════
  const handleSingleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const finalCompanyName = (showAddCompany ? newCompanyName : companyName).trim();
    if (!sampleName.trim()) {
      setErrorMsg('Sample Name is required');
      return;
    }
    if (!finalCompanyName) {
      setErrorMsg('Client Company Name is required');
      return;
    }

    const finalAnalyses = [...selectedAnalyses];
    if (isOtherAnalysis && otherAnalysisText.trim()) {
      const customs = otherAnalysisText.split(',').map((s) => s.trim()).filter(Boolean);
      customs.forEach((c) => {
        if (!finalAnalyses.includes(c)) finalAnalyses.push(c);
      });
    }

    setIsSubmitting(true);
    try {
      // Auto-register company if new
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
        } catch (cErr) {
          console.warn('Auto company creation error:', cErr);
        }
      }

      // Upload Certificate / CoA file if provided
      let uploadedCertUrl: string | undefined = undefined;
      if (certFile) {
        const up = await api.uploadFile(certFile);
        uploadedCertUrl = up.fileUrl;
      }

      // Upload sample photo if provided
      let uploadedPhotoUrl: string | undefined = undefined;
      if (samplePhoto) {
        const upPhoto = await api.uploadFile(samplePhoto);
        uploadedPhotoUrl = upPhoto.fileUrl;
      }

      const chosenLab = labsList.find((l) => l.id === receivingLabId);

      const created = await api.createSample({
        sampleName: sampleName.trim(),
        companyName: finalCompanyName,
        companyAddress: companyAddress.trim() || undefined,
        sampleCode: sampleCode.trim() || undefined,
        sampleNature,
        pictureUrl: uploadedPhotoUrl || (sampleNature.startsWith('Food')
          ? 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'),
        dateOfEntry,
        receivingLabId,
        receivingLabName: chosenLab?.name || 'Standard Analytical Laboratories',
        analysisRequired: finalAnalyses,
        workflowStatus: workflowStatus as any,
        resultStatus: resultStatus as any,
        resultFileUrl: uploadedCertUrl,
        resultComments: resultComments.trim() || undefined,
        processingDate: dateOfEntry || undefined,
        batchNo: batchNo.trim() || undefined,
        nafdacNo: nafdacNo.trim() || undefined,
        sonNo: sonNo.trim() || undefined,
        isoNo: isoNo.trim() || undefined,
        productionDate: productionDate || undefined,
        expiryDate: expiryDate || undefined,
        invoiceNo: invoiceNo.trim() || undefined,
        receiptNo: receiptNo.trim() || undefined,
        sentBy: sentBy || user?.name || 'Registry Officer',
        isHistorical: true,
        suppressNotifications: suppressEmails,
      });

      setSuccessMsg(`Previous sample ${created.sampleCode} successfully recorded into the dashboard!`);
      setTimeout(() => {
        onSuccess(created);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload previous sample');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.bulkImportSamples(parsedRows, suppressEmails);
      setSuccessMsg(`Successfully imported ${res.count} previous samples! Dashboard is now updated.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to bulk import samples');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload / Import Previous Samples (Backlog & Archive)"
      subtitle="Record historical sample records to update portal statistics, certificates, and dashboard analytics"
      maxWidth="860px"
    >
      <div>
        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: 12,
            marginBottom: 20,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'form' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'form' ? '#ffffff' : '#475569',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              padding: '8px 16px',
            }}
          >
            <History size={14} /> Single Previous Sample Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spreadsheet')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'spreadsheet' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'spreadsheet' ? '#ffffff' : '#475569',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              padding: '8px 16px',
            }}
          >
            <FileSpreadsheet size={14} /> Bulk Spreadsheet Upload (CSV / Excel)
          </button>
        </div>

        {/* Notifications / Alerts */}
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
              marginBottom: 16,
            }}
          >
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '13px',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* ═════════════════ TAB 1: FORM ENTRY ═════════════════ */}
        {activeTab === 'form' && (
          <form onSubmit={handleSingleFormSubmit}>
            {/* Section A: Sample Info */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
                1. Historical Sample &amp; Client Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    Sample Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fortified Wheat Flour 50kg or Refined Palm Olein"
                    value={sampleName}
                    onChange={(e) => setSampleName(e.target.value)}
                    required
                  />
                </div>

                {/* Company Selection */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Client Company Name <span className="required-star">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCompany(!showAddCompany)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {showAddCompany ? 'Choose from list' : '+ Add New'}
                    </button>
                  </div>
                  {showAddCompany ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Type new company name..."
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddCompanySubmit}
                        disabled={isAddingCompany || !newCompanyName.trim()}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#0f172a', whiteSpace: 'nowrap' }}
                      >
                        {isAddingCompany ? 'Saving…' : 'Save'}
                      </button>
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

                {/* Company Address */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="#64748b" />
                    <span>Company Address</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Plot 12, Commercial Avenue, Ikeja, Lagos"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

                {/* Sample Code (Editable) */}
                <div className="form-group">
                  <label className="form-label">
                    Historical Sample Code <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={sampleCode}
                    onChange={(e) => {
                      setSampleCode(e.target.value);
                      setIsCodeManuallyEdited(true);
                    }}
                    placeholder="e.g. FD/0825/Ext001"
                    required
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13.5px' }}
                  />
                </div>

                {/* Nature */}
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

                {/* Historical Date of Entry */}
                <div className="form-group">
                  <label className="form-label">
                    Historical Date of Registration / Intake <span className="required-star">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateOfEntry}
                    onChange={(e) => setDateOfEntry(e.target.value)}
                    required
                  />
                </div>

                {/* Receiving Laboratory */}
                <div className="form-group">
                  <label className="form-label">
                    Tested By (Laboratory) <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={receivingLabId}
                    onChange={(e) => setReceivingLabId(e.target.value)}
                    required
                  >
                    {labsList.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section B: Results & Status */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>
                2. Status, Certificate of Analysis &amp; Test Findings
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
                {/* Workflow Status */}
                <div className="form-group">
                  <label className="form-label">
                    Workflow Status <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={workflowStatus}
                    onChange={(e) => setWorkflowStatus(e.target.value)}
                    required
                  >
                    <option value="Closed">Closed (Analysis &amp; Certificate Completed)</option>
                    <option value="Result Received">Result Received (Awaiting Final Archive)</option>
                    <option value="In Processing">In Processing (Testing Underway)</option>
                    <option value="Sent to Lab">Sent to Lab (Dispatched)</option>
                    <option value="Registered">Registered (Registry Intake)</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Analytical Result Status */}
                <div className="form-group">
                  <label className="form-label">
                    Result Status <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={resultStatus}
                    onChange={(e) => setResultStatus(e.target.value)}
                    required
                  >
                    <option value="Completed">Completed (Passed / Validated)</option>
                    <option value="Pending">Pending Analysis</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Rejected">Rejected / Failed</option>
                  </select>
                </div>

                {/* Upload Certificate of Analysis */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    Upload Certificate of Analysis / Final Lab Sheet
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 6 }}>(PDF, JPG, PNG, DOCX — Optional)</span>
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
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setCertFile(f);
                        setCertFileName(f ? f.name : '');
                      }}
                      style={{ fontSize: '12px', flex: 1 }}
                    />
                    {certFileName && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ✓ {certFileName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Result Comments */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Result Findings &amp; Summary Observations</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Conforms to Halal standards. Free from pork derivatives and prohibited solvents."
                    value={resultComments}
                    onChange={(e) => setResultComments(e.target.value)}
                  />
                </div>

                {/* Tests Carried Out */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    Analyses Carried Out <span className="required-star">*</span>
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
                      gap: 6,
                      padding: '10px',
                      background: '#f8fafc',
                      border: '1px solid var(--border-light)',
                      borderRadius: 8,
                      maxHeight: 160,
                      overflowY: 'auto',
                    }}
                  >
                    {analysisOptions.map((a) => {
                      const isChecked = selectedAnalyses.includes(a);
                      return (
                        <label
                          key={a}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '3px 6px',
                            borderRadius: 4,
                            background: isChecked ? '#eff6ff' : 'transparent',
                            color: isChecked ? '#1d4ed8' : '#334155',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleAnalysis(a)}
                          />
                          <span>{a}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Optional Product Traceability */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  3. Product Traceability &amp; Regulatory Numbers
                </h4>
                <span style={{ fontSize: '11px', color: '#64748b' }}>All fields in this section are optional</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Batch Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BATCH-2025-01"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>NAFDAC Reg. No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. A1-0492"
                    value={nafdacNo}
                    onChange={(e) => setNafdacNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>SON / MANCAP No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SON/2025/11"
                    value={sonNo}
                    onChange={(e) => setSonNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>ISO Certification No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ISO 22000"
                    value={isoNo}
                    onChange={(e) => setIsoNo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notification suppression notice */}
            <div
              style={{
                marginBottom: 20,
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <input
                type="checkbox"
                id="suppressEmails"
                checked={suppressEmails}
                onChange={(e) => setSuppressEmails(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="suppressEmails" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer', margin: 0 }}>
                <strong>Historical Archive Mode:</strong> Suppress dispatch notification emails to partner laboratories for this past record.
              </label>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: '#0f172a' }}>
                <Check size={16} />
                {isSubmitting ? 'Recording Previous Sample...' : 'Save & Add to Dashboard'}
              </button>
            </div>
          </form>
        )}

        {/* ═════════════════ TAB 2: SPREADSHEET BULK IMPORT ═════════════════ */}
        {activeTab === 'spreadsheet' && (
          <div>
            {/* Header with Template Download */}
            <div
              style={{
                padding: '16px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 10,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#0369a1', margin: '0 0 4px 0' }}>
                  Upload Excel or CSV Spreadsheet
                </h4>
                <p style={{ fontSize: '12px', color: '#0284c7', margin: 0 }}>
                  Upload your legacy testing logs to populate the dashboard with previous samples in bulk.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="btn btn-primary btn-sm"
                style={{ background: '#0284c7', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Download Sample Template (.xlsx)
              </button>
            </div>

            {/* Dropzone */}
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 12,
                padding: '30px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                marginBottom: 20,
              }}
              onClick={() => document.getElementById('spreadsheet-file-input')?.click()}
            >
              <Upload size={32} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>
                {fileName ? `Selected: ${fileName}` : 'Click or drag file here to import'}
              </p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Supports Excel (.xlsx, .xls) and CSV (.csv) spreadsheets
              </p>
              <input
                type="file"
                id="spreadsheet-file-input"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

            {parseError && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '12.5px',
                  marginBottom: 16,
                }}
              >
                {parseError}
              </div>
            )}

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Parsed Records ({parsedRows.length} samples found)
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Trash2 size={12} /> Clear
                  </button>
                </div>

                <div
                  className="table-responsive"
                  style={{
                    maxHeight: 260,
                    overflowY: 'auto',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: '#ffffff',
                  }}
                >
                  <table style={{ minWidth: 500, width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', color: '#475569' }}>#</th>
                        <th style={{ padding: '8px 10px', color: '#475569' }}>Sample Name</th>
                        <th style={{ padding: '8px 10px', color: '#475569' }}>Company</th>
                        <th style={{ padding: '8px 10px', color: '#475569' }}>Sample Code</th>
                        <th style={{ padding: '8px 10px', color: '#475569' }}>Date</th>
                        <th style={{ padding: '8px 10px', color: '#475569' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 50).map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{r.sampleName}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{r.companyName}</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{r.sampleCode || 'Auto'}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{r.dateOfEntry}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span
                              style={{
                                background: r.workflowStatus === 'Closed' ? '#dcfce7' : '#eff6ff',
                                color: r.workflowStatus === 'Closed' ? '#166534' : '#1d4ed8',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '10.5px',
                                fontWeight: 700,
                              }}
                            >
                              {r.workflowStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 50 && (
                    <div style={{ padding: '8px 12px', fontSize: '11px', color: '#64748b', textAlign: 'center', background: '#f8fafc' }}>
                      Showing first 50 rows of {parsedRows.length} total samples.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImportSubmit}
                disabled={isSubmitting || parsedRows.length === 0}
                className="btn btn-primary"
                style={{ background: '#0f172a' }}
              >
                <Check size={16} />
                {isSubmitting ? 'Importing Samples…' : `Import ${parsedRows.length} Samples to Dashboard`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
