import { useState } from 'react';
import searchIcon from '../assets/icons/search.svg';


const contacts = [
    { id: 1, name: "Bell's Produce – Iloilo" },
    { id: 2, name: "Iloilo Fresh Vegies" },
    { id: 3, name: "Jacks Farmers" },
];

export default function MessageColumn() {
    const [selectedId, setSelectedId] = useState(1);

    return (
        <div className="w-64 border-r border-gray-200 flex flex-col flex-shrink-0 bg-white">
            <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => window.history.back()} className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center border-none cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
                <h2 className="text-2xl font-primary font-bold text-black mb-3">Messages</h2>

                <div className="flex items-center border border-gray-300 rounded-full px-3 py-1.5 mb-4">
                    <input
                        type="text"
                        placeholder="Search"
                        className="border-none outline-none bg-transparent text-sm w-full text-gray-700 font-primary"
                    />
                    <img src={searchIcon} className="w-4 h-4 opacity-50" />
                </div>
            </div>

            <div className="flex flex-col">
                {contacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => setSelectedId(contact.id)}
                        className={`flex items-center gap-3 px-4 py-3 border-none cursor-pointer text-left w-full ${selectedId === contact.id ? 'bg-gray-200' : 'bg-transparent hover:bg-gray-100'
                            }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                        </div>
                        <span className="text-sm font-primary font-semibold text-black">{contact.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}