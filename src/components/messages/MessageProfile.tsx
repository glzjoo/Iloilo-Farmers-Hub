import type { Farmer } from "../../types";

interface MessageProfileProps {
    farmer: Farmer;
}

export default function MessageProfile({ farmer }: MessageProfileProps) {
    return (
        <section className="w-full bg-gray-100 border-b border-gray-200">
            <div className="flex items-center gap-3 px-6 py-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                </div>
                <h2 className="text-lg font-primary font-semibold text-black">{farmer.firstName} {farmer.lastName}</h2>
            </div>
        </section>
    );
}
