import React, { useState } from 'react';

const PromptPage = () => {
  const [formData, setFormData] = useState({
    company: '',
    style: '',
    resolution: '',
    prompt: '',
  });

  const [status, setStatus] = useState({ success: null, message: '' });
  const [showForm, setShowForm] = useState(true);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ success: null, message: '' });

    try {
      const res = await fetch(
        'https://distinct-manually-lemming.ngrok-free.app/webhook/58cb49d0-2d56-401b-99f2-b2c6eec6844e',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ json: formData }]),
        }
      );

      if (res.ok) {
        setStatus({ success: true, message: '✅ Data sent successfully!' });
        setShowForm(false);
      } else {
        setStatus({ success: false, message: '❌ Error sending data.' });
      }
    } catch (error) {
      setStatus({ success: false, message: `❌ Error: ${error.message}` });
    }
  };

  const closeAlert = () => {
    setStatus({ success: null, message: '' });
  };

  return (
    <div className="px-4 md:px-14 lg:px-24 py-10 bg-gray-100 lg:h-screen">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-[#3377F2]">
          Image Generation Form
        </h2>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3377F2]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Style</label>
              <input
                type="text"
                name="style"
                value={formData.style}
                onChange={handleChange}
                placeholder="e.g. minimal blue-tone"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3377F2]"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Resolution
              </label>
              <select
                name="resolution"
                value={formData.resolution}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3377F2]"
              >
                <option value="">Select resolution</option>
                <option value="512x512">512x512</option>
                <option value="768x768">768x768</option>
                <option value="1024x1024">1024x1024</option>
                <option value="1280x720">1280x720 (HD)</option>
                <option value="1920x1080">1920x1080 (Full HD)</option>
                <option value="2048x2048">2048x2048</option>
                <option value="3840x2160">3840x2160 (4K)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Prompt</label>
              <textarea
                name="prompt"
                placeholder='Write a prompt to generate image'
                value={formData.prompt}
                onChange={handleChange}
                rows="4"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3377F2]"
              />
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer bg-[#3377F2] text-white py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition duration-200"
            >
              Send to Webhook
            </button>
          </form>
        )}

        {status.message && (
            <>
          <div
            className={`mt-6 relative text-center px-4 py-3 rounded-lg ${
              status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
            }`}
          >
            <span>{status.message}</span>
            <button
              onClick={closeAlert}
              className="absolute top-2 right-3 text-xl font-bold"
            >
              &times;
            </button>
          </div>
            </>

        )}
        {!showForm &&
        (
            <div className='text-center' >


          <button className='bg-red-500 cursor-pointer text-white mt-5 p-2 rounded-md' onClick={()=> setShowForm(true)}  >Regenerate Image</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PromptPage;
