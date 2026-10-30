import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Sample, Company } from '../../types/index.js';
import { api } from '../../services/api.js';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Check,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Receipt,
  FileText,
  Award,
  Building2,
  Sparkles,
  Plus,
  RefreshCw,
  FileCheck,
  Image as ImageIcon,
  DollarSign,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DirectSampleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSampleRegistered?: (sample: Sample) => void;
  companies?: Company[];
  initialTab?: 'form' | 'spreadsheet';
}

interface ParsedSpreadsheetRow {
  sampleName: string;
  companyName: string;
  companyAddress?: string;
  sampleCode?: string;
  sampleNature?: string;
  batchNo?: string;
  nafdacNo?: string;
  sonNo?: string;
  isoNo?: string;
  barcodeNo?: string;
  otherIdentifier?: string;
  dateOfEntry?: string;
  processingDate?: string;
  receivingLabName?: string;
  receivingLabId?: string;
  analysisRequired?: string;
  invoiceNo?: string;
  invoiceAmount?: string;
  invoiceFileUrl?: string;
  receiptNo?: string;
  receiptFileUrl?: string;
  resultStatus?: string;
  resultComments?: string;
  resultFileUrl?: string;
  workflowStatus?: string;
}

export const DirectSampleUploadModal: React.FC<DirectSampleUploadModalProps> = ({
  isOpen,
  onClose,
  onSampleRegistered,
  companies = [],
  initialTab = 'form',
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'spreadsheet'>(initialTab);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Form State: Section 1 — Sample Information
  const [sampleName, setSampleName] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [sampleNature, setSampleNature] = useState('Food - Solid');
  const [sampleCode, setSampleCode] = useState('');
  const [dateOfEntry, setDateOfEntry] = useState(new Date().toISOString().split('T')[0]);
  const [processingDate, setProcessingDate] = useState('');
  const [receivingLabId, setReceivingLabId] = useState('LAB_1');
  const [receivingLabName, setReceivingLabName] = useState('Hydrochrom Analytical Services Limited');
  const [sentBy, setSentBy] = useState('Registry Officer');

  // Form State: Section 2 — Traceability & Identifiers (Optional)
  const [batchNo, setBatchNo] = useState('');
  const [nafdacNo, setNafdacNo] = useState('');
  const [sonNo, setSonNo] = useState('');
  const [isoNo, setIsoNo] = useState('');
  const [barcodeNo, setBarcodeNo] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Form State: Analyses Checklist
  const analysisOptions = [
    'Porcine DNA Detection (qPCR / Halal Verification)',
    'Ethanol / Alcohol Content Determination (GC-FID)',
    'Gelatin Source Verification',
    'Heavy Metals Screen (Lead, Arsenic, Cadmium, Mercury)',
    'Microbiological Profile & Pathogen Screening',
    'Physico-Chemical Analysis (Moisture, Ash, Fat, Protein)',
    'Vitamin A (Retinol)',
    'Vitamin B-Complex (B1, B2, B3, B6, B9, B12)',
    'Vitamin C (Ascorbic Acid)',
    'Vitamin D (Cholecalciferol / Ergocalciferol)',
    'Vitamin E (Tocopherol)',
    'Preservatives & Synthetic Food Colors',
    'Aflatoxins & Mycotoxins Screen',
  ];
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([
    'Porcine DNA Detection (qPCR / Halal Verification)',
  ]);

  // Form State: Section 3 — Invoices & Billing Upload
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState('');

  // Form State: Section 4 — Proof of Payment Upload
  const [receiptNo, setReceiptNo] = useState('');
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(true);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState('');

  // Form State: Section 5 — Certificate of Analysis (CoA) Upload
  const [resultStatus, setResultStatus] = useState<string>('Completed');
  const [resultComments, setResultComments] = useState('Halal compliance verified. Certified compliant.');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certFileName, setCertFileName] = useState('');

  // Form State: Section 6 — Necessary Technical Documents
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentFileName, setAttachmentFileName] = useState('');
  const [samplePhoto, setSamplePhoto] = useState<File | null>(null);
  const [samplePhotoName, setSamplePhotoName] = useState('');

  // Status & options
  const [workflowStatus, setWorkflowStatus] = useState<string>('Closed');
  const [suppressEmails, setSuppressEmails] = useState(true);

  // Submission & Alert state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Spreadsheet state
  const [parsedRows, setParsedRows] = useState<ParsedSpreadsheetRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [spreadsheetFileName, setSpreadsheetFileName] = useState('');

  // Generate standard code on modal open or nature change
  const generateNewCode = (nature: string) => {
    const isFood = nature.startsWith('Food');
    const prefix = isFood ? 'FD' : 'NF';
    let form = 'SOL';
    const lower = nature.toLowerCase();
    if (lower.includes('semi-solid')) form = 'SS';
    else if (lower.includes('liquid')) form = 'LIQ';
    else if (lower.includes('solid')) form = 'SOL';
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const randSeq = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${form}/${mm}${yy}/Ext${randSeq}`;
  };

  useEffect(() => {
    if (isOpen && !sampleCode) {
      setSampleCode(generateNewCode(sampleNature));
    }
  }, [isOpen]);

  const handleNatureChange = (newNature: string) => {
    setSampleNature(newNature);
    setSampleCode(generateNewCode(newNature));
  };

  const handleCompanySelect = (compName: string) => {
    setSelectedCompany(compName);
    if (compName === '__NEW__') {
      setIsNewCompany(true);
      setCompanyAddress('');
    } else {
      setIsNewCompany(false);
      const found = companies.find((c) => c.name === compName);
      if (found && found.address) {
        setCompanyAddress(found.address);
      }
    }
  };

  const handleLabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const labId = e.target.value;
    setReceivingLabId(labId);
    const labNames: Record<string, string> = {
      LAB_1: 'Hydrochrom Analytical Services Limited',
      LAB_2: 'SAAG Chemical Nigeria Limited (SNCL)',
      LAB_3: 'Kazlat Public Analyst Laboratory',
      LAB_4: 'Central Halal Laboratory',
    };
    setReceivingLabName(labNames[labId] || 'Hydrochrom Analytical Services Limited');
  };

  const handleToggleAnalysis = (analysis: string) => {
    setSelectedAnalyses((prev) =>
      prev.includes(analysis) ? prev.filter((a) => a !== analysis) : [...prev, analysis]
    );
  };

  // ═════════════════ SUBMIT SINGLE DIRECT SAMPLE ═════════════════
  const handleSingleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const finalCompanyName = isNewCompany ? customCompanyName.trim() : selectedCompany.trim();

    if (!sampleName.trim()) {
      setErrorMsg('Please enter a Sample Name.');
      return;
    }
    if (!finalCompanyName) {
      setErrorMsg('Please select or specify a Client Company Name.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgressText('Processing direct sample submission...');

    try {
      let finalInvoiceFileUrl = '';
      let finalReceiptFileUrl = '';
      let finalCertFileUrl = '';
      let finalAttachmentUrl = '';
      let finalPictureUrl = '';

      // 1. Upload Invoice Document if provided
      if (invoiceFile) {
        setUploadProgressText('Uploading Invoice Document...');
        const res = await api.uploadFile(invoiceFile);
        finalInvoiceFileUrl = res.fileUrl;
      }

      // 2. Upload Proof of Payment Document if provided
      if (receiptFile) {
        setUploadProgressText('Uploading Payment Proof Document...');
        const res = await api.uploadFile(receiptFile);
        finalReceiptFileUrl = res.fileUrl;
      }

      // 3. Upload Certificate of Analysis if provided
      if (certFile) {
        setUploadProgressText('Uploading Certificate of Analysis (CoA)...');
        const res = await api.uploadFile(certFile);
        finalCertFileUrl = res.fileUrl;
      }

      // 4. Upload Technical Dossier Document if provided
      if (attachmentFile) {
        setUploadProgressText('Uploading Technical Specification / Dossier...');
        const res = await api.uploadFile(attachmentFile);
        finalAttachmentUrl = res.fileUrl;
      }

      // 5. Upload Sample Photo if provided
      if (samplePhoto) {
        setUploadProgressText('Uploading Sample Picture...');
        const res = await api.uploadFile(samplePhoto);
        finalPictureUrl = res.fileUrl;
      }

      // Create new company if typed
      if (isNewCompany && customCompanyName.trim()) {
        try {
          await api.createCompany(customCompanyName.trim(), undefined, undefined, undefined, companyAddress.trim() || undefined);
        } catch (err) {
          // Company might already exist, continue
        }
      }

      setUploadProgressText('Saving direct sample record to dashboard...');

      const samplePayload: Partial<Sample> = {
        sampleName: sampleName.trim(),
        companyName: finalCompanyName,
        companyAddress: companyAddress.trim() || undefined,
        sampleNature,
        sampleCode: sampleCode.trim() || undefined,
        dateOfEntry: dateOfEntry ? new Date(dateOfEntry).toISOString() : new Date().toISOString(),
        processingDate: processingDate ? new Date(processingDate).toISOString() : (finalCertFileUrl || certFile ? new Date().toISOString() : undefined),
        analysisRequired: selectedAnalyses.length > 0 ? selectedAnalyses : ['Standard Halal Analysis'],
        receivingLabId,
        receivingLabName,
        sentBy: sentBy.trim() || 'Registry Officer',
        batchNo: batchNo.trim() || undefined,
        nafdacNo: nafdacNo.trim() || undefined,
        sonNo: sonNo.trim() || undefined,
        isoNo: isoNo.trim() || undefined,
        barcodeNo: barcodeNo.trim() || undefined,
        productionDate: productionDate ? new Date(productionDate).toISOString() : undefined,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        invoiceNo: invoiceNo.trim() || undefined,
        invoiceAmount: invoiceAmount.trim() || undefined,
        invoiceFileUrl: finalInvoiceFileUrl || undefined,
        receiptNo: receiptNo.trim() || undefined,
        receiptFileUrl: finalReceiptFileUrl || undefined,
        paymentConfirmedByLab: isPaymentConfirmed || Boolean(receiptNo.trim() || finalReceiptFileUrl),
        resultStatus: (finalCertFileUrl || certFile) ? 'Completed' : (resultStatus as any),
        resultFileUrl: finalCertFileUrl || undefined,
        resultComments: resultComments.trim() || undefined,
        attachmentUrl: finalAttachmentUrl || undefined,
        pictureUrl: finalPictureUrl || undefined,
        workflowStatus: (finalCertFileUrl || certFile) ? 'Closed' : (workflowStatus as any),
        isDirectSample: true,
        isHistorical: true,
        suppressNotifications: suppressEmails,
      };

      const created = await api.createSample(samplePayload);

      setSuccessMsg(`✓ Direct sample "${created.sampleName}" [${created.sampleCode}] recorded successfully with all attached documents!`);
      if (onSampleRegistered) {
        onSampleRegistered(created);
      }

      // Reset form
      setSampleName('');
      setCompanyAddress('');
      setBatchNo('');
      setNafdacNo('');
      setSonNo('');
      setIsoNo('');
      setBarcodeNo('');
      setInvoiceNo('');
      setInvoiceAmount('');
      setInvoiceFile(null);
      setInvoiceFileName('');
      setReceiptNo('');
      setReceiptFile(null);
      setReceiptFileName('');
      setCertFile(null);
      setCertFileName('');
      setAttachmentFile(null);
      setAttachmentFileName('');
      setSamplePhoto(null);
      setSamplePhotoName('');
      setSampleCode(generateNewCode(sampleNature));

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Direct sample registration error:', err);
      setErrorMsg(err.message || 'Failed to save direct sample. Please check your connection and inputs.');
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  // ═════════════════ SPREADSHEET PARSING ═════════════════
  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    const file = e.target.files?.[0];
    if (!file) return;

    setSpreadsheetFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setParseError('The uploaded file does not contain any data rows.');
          return;
        }

        const normalized: ParsedSpreadsheetRow[] = rawJson.map((row: any) => {
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k.toLowerCase());
              if (matchedKey && row[matchedKey] !== undefined && String(row[matchedKey]).trim() !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const sName = getVal('Sample Name', 'sampleName', 'Sample', 'Product Name', 'Item');
          const cName = getVal('Company Name', 'companyName', 'Company', 'Client', 'Manufacturer');

          return {
            sampleName: sName,
            companyName: cName,
            companyAddress: getVal('Company Address', 'companyAddress', 'Address'),
            sampleCode: getVal('Sample Code', 'sampleCode', 'Code', 'Sample ID'),
            sampleNature: getVal('Category', 'sampleNature', 'Nature', 'Sample Category') || 'Food - Solid',
            batchNo: getVal('Batch Number', 'batchNo', 'Batch', 'Batch No', 'Lot No'),
            nafdacNo: getVal('NAFDAC Reg No', 'nafdacNo', 'NAFDAC', 'Nafdac No'),
            sonNo: getVal('SON No', 'sonNo', 'SON', 'MANCAP'),
            isoNo: getVal('ISO No', 'isoNo', 'ISO'),
            barcodeNo: getVal('Barcode', 'barcodeNo', 'EAN'),
            dateOfEntry: getVal('Date of Entry', 'dateOfEntry', 'Entry Date', 'Date') || new Date().toISOString().split('T')[0],
            processingDate: getVal('Processing Date', 'processingDate', 'Test Date'),
            receivingLabName: getVal('Receiving Lab', 'receivingLabName', 'Lab', 'Laboratory') || 'Hydrochrom Analytical Services Limited',
            receivingLabId: getVal('Lab ID', 'receivingLabId') || 'LAB_1',
            analysisRequired: getVal('Analysis Required', 'analysisRequired', 'Test Required', 'Tests') || 'Standard Halal Analysis',
            invoiceNo: getVal('Invoice Number', 'invoiceNo', 'Invoice No', 'Invoice'),
            invoiceAmount: getVal('Invoice Amount', 'invoiceAmount', 'Amount', 'Fee'),
            receiptNo: getVal('Receipt Number', 'receiptNo', 'Receipt No', 'Receipt', 'Payment Ref'),
            resultStatus: getVal('Result Status', 'resultStatus', 'Test Result', 'Result') || 'Completed',
            resultComments: getVal('Comments', 'resultComments', 'Remarks', 'Halal Notes') || 'Direct analysis record.',
            workflowStatus: getVal('Workflow Status', 'workflowStatus', 'Status') || 'Closed',
          };
        });

        const validRows = normalized.filter((r) => r.sampleName && r.companyName);
        if (validRows.length === 0) {
          setParseError('No rows with both "Sample Name" and "Company Name" were found in the uploaded file.');
          return;
        }

        setParsedRows(validRows);
      } catch (err: any) {
        setParseError(`Failed to parse file: ${err.message || 'Invalid spreadsheet'}`);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleBulkImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setUploadProgressText(`Importing ${parsedRows.length} direct samples to dashboard...`);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: Partial<Sample>[] = parsedRows.map((r) => ({
        sampleName: r.sampleName,
        companyName: r.companyName,
        companyAddress: r.companyAddress,
        sampleCode: r.sampleCode,
        sampleNature: r.sampleNature || 'Food - Solid',
        batchNo: r.batchNo,
        nafdacNo: r.nafdacNo,
        sonNo: r.sonNo,
        isoNo: r.isoNo,
        barcodeNo: r.barcodeNo,
        dateOfEntry: r.dateOfEntry,
        processingDate: r.processingDate,
        receivingLabName: r.receivingLabName,
        receivingLabId: r.receivingLabId,
        analysisRequired: r.analysisRequired
          ? r.analysisRequired.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Standard Halal Analysis'],
        invoiceNo: r.invoiceNo,
        invoiceAmount: r.invoiceAmount,
        receiptNo: r.receiptNo,
        paymentConfirmedByLab: Boolean(r.receiptNo),
        resultStatus: (r.resultStatus as any) || 'Completed',
        resultComments: r.resultComments,
        workflowStatus: (r.workflowStatus as any) || 'Closed',
        isDirectSample: true,
        isHistorical: true,
      }));

      const res = await api.bulkImportSamples(payload);
      setSuccessMsg(`✓ Successfully imported ${res.count} direct sample records! Dashboard analytics updated.`);
      setParsedRows([]);
      setSpreadsheetFileName('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setErrorMsg(err.message || 'Failed to import samples.');
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Sample Name': 'Fortified Wheat Flour 50kg',
        'Company Name': 'Dangote Flour Mills Plc',
        'Company Address': '1 Commercial Road, Apapa, Lagos',
        'Sample Code': 'FD/1026/Ext001',
        'Category': 'Food - Solid',
        'Batch Number': 'DFM-2025-01',
        'NAFDAC Reg No': 'A1-4821',
        'SON No': 'SON-2025-01',
        'ISO No': 'ISO 22000:2018',
        'Barcode': '6151234567890',
        'Date of Entry': '2025-01-15',
        'Processing Date': '2025-01-16',
        'Receiving Lab': 'Hydrochrom Analytical Services Limited',
        'Analysis Required': 'Porcine DNA Detection (qPCR / Halal Verification), Ethanol / Alcohol Content Determination (GC-FID)',
        'Invoice Number': 'INV-2025-001',
        'Invoice Amount': '150000',
        'Receipt Number': 'RCP-2025-001',
        'Result Status': 'Completed',
        'Workflow Status': 'Closed',
        'Comments': 'Porcine DNA: Negative (<0.01%). Ethanol: 0.00%. Completed analysis.',
      },
      {
        'Sample Name': 'Skin Nourishing Cream 250ml',
        'Company Name': 'Lotus Cosmetics Nigeria Ltd',
        'Company Address': 'Plot 4 Acme Road, Ogba, Ikeja, Lagos',
        'Sample Code': 'NF/1026/Ext002',
        'Category': 'Cosmetics / Personal Care',
        'Batch Number': 'LOT-2025-08',
        'NAFDAC Reg No': 'B2-9102',
        'SON No': 'SON-2025-09',
        'ISO No': 'ISO 9001:2015',
        'Barcode': '6159876543210',
        'Date of Entry': '2025-02-10',
        'Processing Date': '2025-02-11',
        'Receiving Lab': 'SAAG Chemical Nigeria Limited (SNCL)',
        'Analysis Required': 'Porcine DNA Detection (qPCR / Halal Verification), Heavy Metals Screen',
        'Invoice Number': 'INV-2025-002',
        'Invoice Amount': '120000',
        'Receipt Number': 'RCP-2025-002',
        'Result Status': 'Completed',
        'Workflow Status': 'Closed',
        'Comments': 'Gelatin porcine DNA absent. Compliant with halal cosmetics standards.',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Direct Samples Template');
    XLSX.writeFile(wb, 'HDI_Direct_Samples_Import_Template.xlsx');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Direct Samples Intake & Document Upload Desk"
      subtitle="Upload direct/previous samples with invoices, proof of payment, Certificate of Analysis (CoA), and technical dossiers"
      maxWidth="880px"
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
            <Layers size={14} /> Single Direct Sample Form
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

        {uploadProgressText && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '12.5px',
              marginBottom: 16,
            }}
          >
            <RefreshCw size={14} className="spin" />
            {uploadProgressText}
          </div>
        )}

        {/* ═════════════════ TAB 1: FORM ENTRY ═════════════════ */}
        {activeTab === 'form' && (
          <form onSubmit={handleSingleFormSubmit}>
            {/* Section 1: Sample & Client Info */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0f172a', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  1
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Sample & Client Information
                </h4>
              </div>

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
                      onClick={() => {
                        setIsNewCompany(!isNewCompany);
                        setSelectedCompany(isNewCompany ? '' : '__NEW__');
                      }}
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
                      {isNewCompany ? '← Choose Existing' : '+ Type New Company'}
                    </button>
                  </div>

                  {isNewCompany ? (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dangote Sugar Refinery Plc"
                      value={customCompanyName}
                      onChange={(e) => setCustomCompanyName(e.target.value)}
                      required
                    />
                  ) : (
                    <select
                      className="form-select"
                      value={selectedCompany}
                      onChange={(e) => handleCompanySelect(e.target.value)}
                      required
                    >
                      <option value="">-- Select Client Organization --</option>
                      {companies.map((c) => (
                        <option key={c._id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__NEW__">+ Type a New Company Name</option>
                    </select>
                  )}
                </div>

                {/* Company Address */}
                <div className="form-group">
                  <label className="form-label">
                    Company Address <span style={{ fontSize: '11px', color: '#64748b' }}>(Auto-filled or Custom)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Plot 12, Industrial Estate, Ikeja, Lagos"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

                {/* Sample Category / Nature */}
                <div className="form-group">
                  <label className="form-label">
                    Sample Category / Nature <span className="required-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={sampleNature}
                    onChange={(e) => handleNatureChange(e.target.value)}
                    required
                  >
                    <option value="Food - Solid">Food - Solid (FD)</option>
                    <option value="Food - Liquid">Food - Liquid (FD)</option>
                    <option value="Food - Semi-Solid">Food - Semi-Solid (FD)</option>
                    <option value="Non-Food - Solid">Non-Food - Solid (NF)</option>
                    <option value="Non-Food - Liquid">Non-Food - Liquid (NF)</option>
                    <option value="Non-Food - Semi-Solid">Non-Food - Semi-Solid (NF)</option>
                  </select>
                </div>

                {/* Sample Code (Editable with Regenerate) */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Sample Code <span className="required-star">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSampleCode(generateNewCode(sampleNature))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: 0,
                      }}
                      title="Generate a fresh sequence code"
                    >
                      <RefreshCw size={11} /> Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={sampleCode}
                    onChange={(e) => setSampleCode(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    required
                  />
                </div>

                {/* Dates & Labs */}
                <div className="form-group">
                  <label className="form-label">Date of Entry / Registration</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateOfEntry}
                    onChange={(e) => setDateOfEntry(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Laboratory</label>
                  <select className="form-select" value={receivingLabId} onChange={handleLabChange}>
                    <option value="LAB_1">Hydrochrom Analytical Services Limited</option>
                    <option value="LAB_2">SAAG Chemical Nigeria Limited (SNCL)</option>
                    <option value="LAB_3">Kazlat Public Analyst Laboratory</option>
                    <option value="LAB_4">Central Halal Laboratory</option>
                  </select>
                </div>

                {/* Analyses Checklist */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">
                    Analysis Required ({selectedAnalyses.length} selected)
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
                      maxHeight: 150,
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

            {/* Section 2: Invoice Details & Document Upload */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)', background: '#faf5ff', padding: '14px 16px', borderRadius: 10, border: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  2
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#581c87', margin: 0 }}>
                  Invoice & Billing Upload
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: '#581c87' }}>Invoice Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. INV-2025-081"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: '#581c87' }}>Invoice Amount (₦)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 150000"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                  />
                </div>

                {/* Upload Invoice File */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#581c87' }}>
                    Upload Invoice Document (PDF / Scanned Invoice)
                  </label>
                  <div
                    style={{
                      border: '1.5px dashed #c084fc',
                      borderRadius: 8,
                      padding: '10px 14px',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      id="direct-invoice-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setInvoiceFile(f);
                        setInvoiceFileName(f ? f.name : '');
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} color="#7c3aed" />
                      <span style={{ fontSize: '12.5px', color: invoiceFileName ? '#581c87' : '#64748b', fontWeight: invoiceFileName ? 700 : 400 }}>
                        {invoiceFileName ? `✓ ${invoiceFileName}` : 'Choose or drag invoice document…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {invoiceFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setInvoiceFile(null);
                            setInvoiceFileName('');
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', color: '#dc2626' }}
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => document.getElementById('direct-invoice-upload')?.click()}
                        className="btn btn-sm"
                        style={{ background: '#7c3aed', color: '#fff', fontSize: '11.5px', padding: '5px 12px' }}
                      >
                        <Upload size={12} /> {invoiceFileName ? 'Replace File' : 'Browse File'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Proof of Payment Upload */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)', background: '#f0fdf4', padding: '14px 16px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  3
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#14532d', margin: 0 }}>
                  Proof of Payment Upload
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: '#14532d' }}>
                    Receipt No. / Bank Ref Number
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RCP-2025-081 or TRX-99214"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: '#14532d' }}>Payment Confirmation</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '12.5px', color: '#166534', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={isPaymentConfirmed}
                      onChange={(e) => setIsPaymentConfirmed(e.target.checked)}
                    />
                    Mark Payment as Confirmed by Lab / Bank
                  </label>
                </div>

                {/* Upload Receipt File */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#14532d' }}>
                    Upload Proof of Payment / Bank Teller / Transfer Slip
                  </label>
                  <div
                    style={{
                      border: '1.5px dashed #86efac',
                      borderRadius: 8,
                      padding: '10px 14px',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      id="direct-receipt-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setReceiptFile(f);
                        setReceiptFileName(f ? f.name : '');
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Receipt size={16} color="#16a34a" />
                      <span style={{ fontSize: '12.5px', color: receiptFileName ? '#14532d' : '#64748b', fontWeight: receiptFileName ? 700 : 400 }}>
                        {receiptFileName ? `✓ ${receiptFileName}` : 'Choose or drag payment proof / receipt…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {receiptFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFile(null);
                            setReceiptFileName('');
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', color: '#dc2626' }}
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => document.getElementById('direct-receipt-upload')?.click()}
                        className="btn btn-sm"
                        style={{ background: '#16a34a', color: '#fff', fontSize: '11.5px', padding: '5px 12px' }}
                      >
                        <Upload size={12} /> {receiptFileName ? 'Replace File' : 'Browse File'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Certificate of Analysis (CoA) Upload */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)', background: '#eff6ff', padding: '14px 16px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  4
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                  Certificate of Analysis (CoA) & Conformity Upload
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: '#1e3a8a' }}>Result Classification</label>
                  <select
                    className="form-select"
                    value={resultStatus}
                    onChange={(e: any) => setResultStatus(e.target.value)}
                  >
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px', color: '#1e3a8a' }}>Workflow Status</label>
                  <select
                    className="form-select"
                    value={workflowStatus}
                    onChange={(e) => setWorkflowStatus(e.target.value)}
                  >
                    <option value="Closed">Closed (Analysis & Certificate Completed)</option>
                    <option value="Result Received">Result Received (Pending Final QA)</option>
                    <option value="In Processing">In Processing (Testing Underway)</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#1e3a8a' }}>Analytical Remarks & Halal Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={resultComments}
                    onChange={(e) => setResultComments(e.target.value)}
                    placeholder="e.g. Porcine DNA: Negative (<0.01%). Ethanol: 0.00%. Verified compliant."
                  />
                </div>

                {/* Upload Certificate File */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label" style={{ fontSize: '12px', color: '#1e3a8a' }}>
                    Upload Signed Certificate of Analysis (PDF / Scanned CoA)
                  </label>
                  <div
                    style={{
                      border: '1.5px dashed #93c5fd',
                      borderRadius: 8,
                      padding: '10px 14px',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      id="direct-cert-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setCertFile(f);
                        setCertFileName(f ? f.name : '');
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Award size={16} color="#2563eb" />
                      <span style={{ fontSize: '12.5px', color: certFileName ? '#1e3a8a' : '#64748b', fontWeight: certFileName ? 700 : 400 }}>
                        {certFileName ? `✓ ${certFileName}` : 'Choose or drag Certificate of Analysis document…'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {certFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setCertFile(null);
                            setCertFileName('');
                          }}
                          className="btn btn-sm btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px', color: '#dc2626' }}
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => document.getElementById('direct-cert-upload')?.click()}
                        className="btn btn-sm"
                        style={{ background: '#2563eb', color: '#fff', fontSize: '11.5px', padding: '5px 12px' }}
                      >
                        <Upload size={12} /> {certFileName ? 'Replace File' : 'Browse File'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Necessary Technical Dossier & Sample Inspection Photo */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#475569', color: '#fff', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  5
                </span>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Technical Dossier & Batch Identifiers (Optional)
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, marginBottom: 14 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Batch Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="BATCH-2025-01"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>NAFDAC Reg No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="A1-1234"
                    value={nafdacNo}
                    onChange={(e) => setNafdacNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>SON / MANCAP No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="SON-2025"
                    value={sonNo}
                    onChange={(e) => setSonNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>ISO Cert No.</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ISO 22000"
                    value={isoNo}
                    onChange={(e) => setIsoNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Barcode / EAN</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="615000000000"
                    value={barcodeNo}
                    onChange={(e) => setBarcodeNo(e.target.value)}
                  />
                </div>
              </div>

              {/* Upload Technical Spec File */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12 }}>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Upload Technical Specification / Dossier (PDF / Word)
                  </label>
                  <div
                    style={{
                      border: '1px dashed #cbd5e1',
                      borderRadius: 8,
                      padding: '8px 12px',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      id="direct-attachment-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setAttachmentFile(f);
                        setAttachmentFileName(f ? f.name : '');
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileCheck size={14} color="#64748b" />
                      <span style={{ fontSize: '12px', color: attachmentFileName ? '#0f172a' : '#64748b', fontWeight: attachmentFileName ? 600 : 400 }}>
                        {attachmentFileName ? `✓ ${attachmentFileName}` : 'Choose dossier…'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('direct-attachment-upload')?.click()}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {attachmentFileName ? 'Change' : 'Browse'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>
                    Upload Physical Sample Photo (Optional)
                  </label>
                  <div
                    style={{
                      border: '1px dashed #cbd5e1',
                      borderRadius: 8,
                      padding: '8px 12px',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      id="direct-photo-upload"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setSamplePhoto(f);
                        setSamplePhotoName(f ? f.name : '');
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ImageIcon size={14} color="#64748b" />
                      <span style={{ fontSize: '12px', color: samplePhotoName ? '#0f172a' : '#64748b', fontWeight: samplePhotoName ? 600 : 400 }}>
                        {samplePhotoName ? `✓ ${samplePhotoName}` : 'Choose photo…'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('direct-photo-upload')?.click()}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {samplePhotoName ? 'Change' : 'Browse'}
                    </button>
                  </div>
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
                id="suppressEmailsDirect"
                checked={suppressEmails}
                onChange={(e) => setSuppressEmails(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="suppressEmailsDirect" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer', margin: 0 }}>
                <strong>Direct / Historical Archive Mode:</strong> Suppress dispatch notification emails to partner laboratories for this direct record.
              </label>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: '#0f172a' }}>
                <Check size={16} />
                {isSubmitting ? 'Uploading Documents & Saving...' : 'Save Direct Sample & Documents'}
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
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0369a1', margin: 0 }}>
                  Standard Excel / CSV Template
                </h4>
                <p style={{ fontSize: '12px', color: '#0284c7', margin: '4px 0 0 0' }}>
                  Download the official spreadsheet template pre-formatted with all sample, invoice, payment, and CoA fields.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="btn btn-primary btn-sm"
                style={{ background: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Download Sample Template (.xlsx)
              </button>
            </div>

            {/* Upload Zone */}
            <div
              onClick={() => document.getElementById('spreadsheet-file-input-direct')?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 12,
                padding: '32px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                cursor: 'pointer',
                marginBottom: 18,
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="file"
                id="spreadsheet-file-input-direct"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleSpreadsheetUpload}
              />
              <FileSpreadsheet size={36} color="#0f172a" style={{ margin: '0 auto 10px auto', display: 'block' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {spreadsheetFileName ? `Selected: ${spreadsheetFileName}` : 'Click or drag file here to import'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
              </div>
            </div>

            {parseError && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  fontSize: '12.5px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={15} />
                {parseError}
              </div>
            )}

            {/* Parsed Rows Preview Table */}
            {parsedRows.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Previewing {parsedRows.length} Samples Ready for Import
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setSpreadsheetFileName('');
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

// Backward-compatible alias
export const PreviousSampleUploadModal = DirectSampleUploadModal;

