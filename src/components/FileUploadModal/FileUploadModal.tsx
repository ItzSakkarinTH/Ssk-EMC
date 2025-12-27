'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, FileJson, X, Check, AlertCircle, Download, Eye, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './FileUploadModal.module.css';

export interface UploadedData {
    data: Record<string, unknown>[];
    fileName: string;
    fileType: 'excel' | 'json';
}

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: UploadedData) => Promise<void>;
    type: 'shelters' | 'items';
    title?: string;
}

// ตัวอย่างข้อมูลสำหรับ Shelters
const shelterExampleData = [
    { name: 'ศูนย์พักพิงบ้านใหม่', district: 'เมืองศรีสะเกษ', subdistrict: 'เมืองใต้', capacity: 100, status: 'active', address: 'หมู่ 1 ถ.ราชการ' },
    { name: 'ศูนย์พักพิงวัดป่า', district: 'กันทรลักษ์', subdistrict: 'น้ำอ้อม', capacity: 150, status: 'active', address: 'หมู่ 5' },
    { name: 'ศูนย์พักพิงโรงเรียน', district: 'อุทุมพรพิสัย', subdistrict: 'กำแพง', capacity: 200, status: 'inactive', address: 'ถ.สุขสวัสดิ์' },
];

// ตัวอย่างข้อมูลสำหรับ Items
const itemExampleData = [
    { name: 'ข้าวสาร', category: 'อาหาร', unit: 'ถุง', minStock: 10, maxStock: 100, description: 'ข้าวสารหอมมะลิ 5 กก.' },
    { name: 'น้ำดื่ม', category: 'เครื่องดื่ม', unit: 'แพ็ค', minStock: 20, maxStock: 200, description: 'น้ำดื่มขวด 600 ml' },
    { name: 'ยาพาราเซตามอล', category: 'ยา', unit: 'กล่อง', minStock: 5, maxStock: 50, description: 'ยาแก้ปวดลดไข้' },
];

export default function FileUploadModal({
    isOpen,
    onClose,
    onImport,
    type,
    title
}: FileUploadModalProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'example'>('upload');
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exampleData = type === 'shelters' ? shelterExampleData : itemExampleData;

    const getColumns = () => {
        if (type === 'shelters') {
            return [
                { key: 'name', label: 'ชื่อศูนย์', required: true },
                { key: 'district', label: 'อำเภอ', required: true },
                { key: 'subdistrict', label: 'ตำบล', required: true },
                { key: 'capacity', label: 'ความจุ', required: true },
                { key: 'status', label: 'สถานะ', required: false },
                { key: 'address', label: 'ที่อยู่', required: false },
            ];
        } else {
            return [
                { key: 'name', label: 'ชื่อสินค้า', required: true },
                { key: 'category', label: 'หมวดหมู่', required: true },
                { key: 'unit', label: 'หน่วย', required: true },
                { key: 'minStock', label: 'สต๊อกต่ำสุด', required: true },
                { key: 'maxStock', label: 'สต๊อกสูงสุด', required: true },
                { key: 'description', label: 'คำอธิบาย', required: false },
            ];
        }
    };

    const columns = getColumns();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        setError(null);
        setParsedData([]);

        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (!['xlsx', 'xls', 'json'].includes(fileExtension || '')) {
            setError('ไฟล์ต้องเป็น Excel (.xlsx, .xls) หรือ JSON (.json) เท่านั้น');
            return;
        }

        setUploadedFile(file);

        try {
            if (fileExtension === 'json') {
                const text = await file.text();
                const jsonData = JSON.parse(text);

                if (Array.isArray(jsonData)) {
                    setParsedData(jsonData);
                } else if (jsonData.data && Array.isArray(jsonData.data)) {
                    setParsedData(jsonData.data);
                } else {
                    throw new Error('JSON must be an array or have a "data" array property');
                }
            } else {
                // Excel file
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                setParsedData(jsonData as Record<string, unknown>[]);
            }
        } catch (err) {
            console.error('Error parsing file:', err);
            setError('ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์');
            setParsedData([]);
        }
    };

    const handleImport = async () => {
        if (parsedData.length === 0 || !uploadedFile) return;

        setImporting(true);
        try {
            await onImport({
                data: parsedData,
                fileName: uploadedFile.name,
                fileType: uploadedFile.name.endsWith('.json') ? 'json' : 'excel'
            });
            handleReset();
            onClose();
        } catch (err) {
            console.error('Import error:', err);
            setError('เกิดข้อผิดพลาดในการนำเข้าข้อมูล');
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setUploadedFile(null);
        setParsedData([]);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const downloadExampleExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(exampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, `${type}_example.xlsx`);
    };

    const downloadExampleJson = () => {
        const blob = new Blob([JSON.stringify(exampleData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_example.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="dash-modal-overlay" onClick={onClose}>
            <div className={`dash-modal ${styles.uploadModal}`} onClick={e => e.stopPropagation()}>
                <div className="dash-modal-header">
                    <h2>
                        <Upload size={24} style={{ marginRight: '0.5rem' }} />
                        {title || `นำเข้าข้อมูล${type === 'shelters' ? 'ศูนย์พักพิง' : 'สินค้า'}`}
                    </h2>
                    <button className="dash-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'upload' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload size={18} />
                        อัพโหลดไฟล์
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'example' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('example')}
                    >
                        <Eye size={18} />
                        ดูตัวอย่างรูปแบบ
                    </button>
                </div>

                <div className="dash-modal-body">
                    {activeTab === 'upload' ? (
                        <div className={styles.uploadSection}>
                            {/* Drop Zone */}
                            <div
                                className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''} ${uploadedFile ? styles.dropZoneHasFile : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.json"
                                    onChange={handleFileInput}
                                    style={{ display: 'none' }}
                                />

                                {uploadedFile ? (
                                    <div className={styles.fileInfo}>
                                        <div className={styles.fileIcon}>
                                            {uploadedFile.name.endsWith('.json') ? (
                                                <FileJson size={48} />
                                            ) : (
                                                <FileSpreadsheet size={48} />
                                            )}
                                        </div>
                                        <div className={styles.fileName}>{uploadedFile.name}</div>
                                        <div className={styles.fileSize}>
                                            {(uploadedFile.size / 1024).toFixed(2)} KB
                                        </div>
                                        <button
                                            className={styles.removeFileBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleReset();
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            ลบไฟล์
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.dropZoneIcon}>
                                            <Upload size={48} />
                                        </div>
                                        <div className={styles.dropZoneText}>
                                            <p>ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
                                            <span>รองรับไฟล์ .xlsx, .xls, .json</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className={styles.errorMessage}>
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Parsed Data Preview */}
                            {parsedData.length > 0 && (
                                <div className={styles.previewSection}>
                                    <div className={styles.previewHeader}>
                                        <h3>
                                            <Check size={20} style={{ color: '#10b981' }} />
                                            พบข้อมูล {parsedData.length} รายการ
                                        </h3>
                                    </div>

                                    <div className={styles.previewTableWrapper}>
                                        <table className={styles.previewTable}>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    {columns.map(col => (
                                                        <th key={col.key}>{col.label}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedData.slice(0, 5).map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td>{idx + 1}</td>
                                                        {columns.map(col => (
                                                            <td key={col.key}>
                                                                {String(row[col.key] ?? '')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {parsedData.length > 5 && (
                                        <div className={styles.moreData}>
                                            ... และอีก {parsedData.length - 5} รายการ
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.exampleSection}>
                            <div className={styles.exampleInfo}>
                                <h3>📋 โครงสร้างข้อมูลที่รองรับ</h3>
                                <p>กรุณาจัดรูปแบบข้อมูลตามตารางด้านล่าง</p>
                            </div>

                            {/* Column Definition */}
                            <div className={styles.columnDefinition}>
                                <h4>คอลัมน์ที่รองรับ</h4>
                                <div className={styles.columnList}>
                                    {columns.map(col => (
                                        <div key={col.key} className={styles.columnItem}>
                                            <span className={styles.columnKey}>{col.key}</span>
                                            <span className={styles.columnLabel}>{col.label}</span>
                                            {col.required && (
                                                <span className={styles.requiredBadge}>จำเป็น</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Excel Example */}
                            <div className={styles.exampleBlock}>
                                <div className={styles.exampleBlockHeader}>
                                    <h4>
                                        <FileSpreadsheet size={20} />
                                        ตัวอย่าง Excel
                                    </h4>
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={downloadExampleExcel}
                                    >
                                        <Download size={16} />
                                        ดาวน์โหลดตัวอย่าง
                                    </button>
                                </div>
                                <div className={styles.exampleTableWrapper}>
                                    <table className={styles.exampleTable}>
                                        <thead>
                                            <tr>
                                                {columns.map(col => (
                                                    <th key={col.key}>{col.key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exampleData.map((row, idx) => (
                                                <tr key={idx}>
                                                    {columns.map(col => (
                                                        <td key={col.key}>
                                                            {String((row as Record<string, unknown>)[col.key] ?? '')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* JSON Example */}
                            <div className={styles.exampleBlock}>
                                <div className={styles.exampleBlockHeader}>
                                    <h4>
                                        <FileJson size={20} />
                                        ตัวอย่าง JSON
                                    </h4>
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={downloadExampleJson}
                                    >
                                        <Download size={16} />
                                        ดาวน์โหลดตัวอย่าง
                                    </button>
                                </div>
                                <pre className={styles.jsonPreview}>
                                    {JSON.stringify(exampleData, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                <div className="dash-modal-footer">
                    <button
                        type="button"
                        className="dash-btn dash-btn-secondary"
                        onClick={onClose}
                        disabled={importing}
                    >
                        ยกเลิก
                    </button>
                    {activeTab === 'upload' && parsedData.length > 0 && (
                        <button
                            type="button"
                            className="dash-btn dash-btn-primary"
                            onClick={handleImport}
                            disabled={importing || parsedData.length === 0}
                        >
                            {importing ? (
                                <>กำลังนำเข้า...</>
                            ) : (
                                <>
                                    <Check size={18} />
                                    นำเข้า {parsedData.length} รายการ
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
