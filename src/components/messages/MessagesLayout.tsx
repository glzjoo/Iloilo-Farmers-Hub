import MessageProfile from "./MessageProfile";
import addbutton from '../../assets/icons/add.svg';

const selectedContact = {
    uid: '1',
    firstName: "Bell's Produce",
    lastName: '– Iloilo',
    phoneNo: '09123456789',
    email: 'bells@gmail.com',
    idType: 'Business Permit',
    cardAddress: 'Iloilo City, Philippines',
    profileImage: '',
    createdAt: new Date(),
};

export default function MessagesLayout() {
    return (
        <div className="flex-1 flex flex-col border-l border-gray-200">
            <MessageProfile farmer={selectedContact} />

            {/* Chat messages area */}
            <div className="flex-1 p-6 overflow-y-auto bg-white">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                    </div>
                    <div className="bg-primary text-white px-4 py-2.5 rounded-2xl rounded-tl-none max-w-sm">
                        <p className="text-sm font-primary">Hell po, interisado ba kayo sa aming produkto?</p>
                    </div>
                </div>
            </div>

            {/* Message input bar */}
            <div className="border-t border-gray-200 p-3 flex items-center gap-3 bg-white">
                <button className="w-9 h-9 rounded-full bg-gray-white flex items-center justify-center border-none cursor-pointer text-gray-500 flex-shrink-0">
                    <img src={addbutton} alt="Add" />
                </button>
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm font-primary outline-none"
                />
                <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center border-none cursor-pointer flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
