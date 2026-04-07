import type { Report } from './adminTypes';

interface ConversationModalProps {
    report: Report;
    onClose: () => void;
}

export default function ConversationModal({ report, onClose }: ConversationModalProps) {
    // Mock conversation data
    const messages = [
        { sender: report.reportedBy, text: 'Hi, I want to buy your vegetables.', time: '10:30 AM', isReporter: true },
        { sender: report.reportedUser, text: 'Sure! Which ones would you like?', time: '10:32 AM', isReporter: false },
        { sender: report.reportedBy, text: 'The tomatoes, please. Are they really from Iloilo?', time: '10:33 AM', isReporter: true },
        { sender: report.reportedUser, text: 'Yes of course! Fresh from our farm.', time: '10:35 AM', isReporter: false },
        { sender: report.reportedBy, text: 'But your listing says Iloilo and the delivery package came from Manila???', time: '10:40 AM', isReporter: true },
        { sender: report.reportedUser, text: 'Its just the shipping route.', time: '10:45 AM', isReporter: false },
        { sender: report.reportedBy, text: 'I dont believe you. The products are clearly not local produce. Im reporting this.', time: '10:48 AM', isReporter: true },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-primary px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="text-white font-bold text-lg">Conversation History</h3>
                        <p className="text-green-200 text-xs mt-0.5">{report.reportedBy} ↔ {report.reportedUser}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white bg-transparent border-none cursor-pointer text-xl leading-none">✕</button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.isReporter ? 'items-start' : 'items-end'}`}>
                            <p className="text-[10px] text-gray-400 mb-1 px-1">{msg.sender} · {msg.time}</p>
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.isReporter
                                    ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                                    : 'bg-primary text-white rounded-tr-sm'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg border-none cursor-pointer text-sm font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
