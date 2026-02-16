import samplePhotoFarmer from '../assets/images/sample-photo-farmer.jpg';

const stories = [
    {
        name: 'Mia Agri',
        role: 'Vegetable Farmer',
        review: '"My income doubled in just 3 months! I can now sell my vegetables directly to customers who appreciate quality."',
        image: samplePhotoFarmer,
    },
    {
        name: 'Ray Parks',
        role: 'Rice and Corn Seller',
        review: '"My income doubled in just 3 months! I can now sell my vegetables directly to customers who appreciate quality."',
        image: samplePhotoFarmer,
    },
    {
        name: 'Gly',
        role: '20 Member Farmers',
        review: '"My income doubled in just 3 months! I can now sell my vegetables directly to customers who appreciate quality."',
        image: samplePhotoFarmer,
    },
];

export default function SuccessStories() {
    return (
        <section className="w-full py-16 px-10">
            <div className="max-w-7xl mx-auto mb-10">
                <h1 className="text-3xl text-center font-primary font-bold text-black mb-2">Success Stories from Fellow Farmers</h1>
                <p className="text-lg text-center font-primary text-gray-600">Hear from farmers who have transformed their business with Iloilo Farmers Hub</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {stories.map((story, i) => (
                    <div key={i} className="border border-gray-200 p-6" style={{ borderRadius: '40px' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <img src={story.image} alt={story.name} className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <h3 className="text-sm font-primary font-bold text-black">{story.name}</h3>
                                <p className="text-xs font-primary text-gray-500">{story.role}</p>
                            </div>
                        </div>
                        <p className="text-sm font-primary text-gray-700 leading-relaxed">{story.review}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}