

const stats = [
    { label: 'Trusted by', value: '1,900+ customers' },
    { label: 'Backed by', value: '1000+ farmers' },
    { label: 'Backed by', value: '1000+ products' },
];

export default function StatsBar() {
    return (
        <section className="w-full bg-dark py-6 sm:py-8">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 px-4">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-green-700 text-white rounded-full px-6 sm:px-8 py-3 sm:py-4 text-center w-full sm:w-auto sm:min-w-[200px]"
                    >
                        <p className="text-xs opacity-80 mb-1">{stat.label}</p>
                        <p className="text-sm sm:text-base font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
