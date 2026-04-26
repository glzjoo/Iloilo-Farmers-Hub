// src/components/admin/EvidenceModal.tsx
import { useState } from 'react';
import type { Report } from './adminTypes';

interface EvidenceModalProps {
    report: Report;
    onClose: () => void;
}

export default function EvidenceModal({ report, onClose }: EvidenceModalProps) {
    const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

    const mediaUrls = report.mediaUrls || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[85vh]" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-white font-bold text-lg">Provided Evidence</h3>
                        <p className="text-green-200 text-xs mt-0.5">
                            Report {report.id} · {report.reportedBy} → {report.reportedUser}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white/80 hover:text-white bg-transparent border-none cursor-pointer text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {mediaUrls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h4 className="text-gray-500 font-medium mb-1">No evidence provided</h4>
                            <p className="text-gray-400 text-sm">This report was submitted without any media attachments.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {mediaUrls.map((media, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedMedia(media)}
                                    className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer p-0"
                                >
                                    {media.type === 'video' ? (
                                        <>
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                                <svg className="w-12 h-12 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                                                Video
                                            </div>
                                        </>
                                    ) : (
                                        <img 
                                            src={media.url} 
                                            alt={`Evidence ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    )}
                                    
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Report reason */}
                    <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Report Details</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex gap-2">
                                <span className="text-gray-400 w-20 shrink-0">Type:</span>
                                <span className="text-gray-700 font-medium">{report.type}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-400 w-20 shrink-0">Reason:</span>
                                <span className="text-gray-700">{report.reason}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-400 w-20 shrink-0">Reported by:</span>
                                <span className="text-gray-700">{report.reportedBy}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-400 w-20 shrink-0">Date:</span>
                                <span className="text-gray-700">{report.date}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                    <p className="text-xs text-gray-400">
                        {mediaUrls.length} file{mediaUrls.length !== 1 ? 's' : ''} attached
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg border-none cursor-pointer text-sm font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Full-screen media viewer */}
            {selectedMedia && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <button
                        onClick={() => setSelectedMedia(null)}
                        className="absolute top-4 right-4 text-white/80 hover:text-white bg-transparent border-none cursor-pointer text-2xl"
                    >
                        ✕
                    </button>
                    
                    {selectedMedia.type === 'video' ? (
                        <video
                            src={selectedMedia.url}
                            controls
                            autoPlay
                            className="max-w-full max-h-[90vh] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <img
                            src={selectedMedia.url}
                            alt="Evidence"
                            className="max-w-full max-h-[90vh] rounded-lg object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </div>
    );
}