import MessageColumn from "../components/MessageColumn";
import MessagesLayout from "../components/MessagesLayout";

export default function MessagesPage() {
    return (
        <div className="flex flex-1 min-h-[calc(100vh-200px)]">
            <MessageColumn />
            <MessagesLayout />
        </div>
    );
}
