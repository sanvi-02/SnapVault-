import { useState, useEffect } from "react";
import API from "../api/axios";

const CommentBox = ({ mediaId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const res = await API.get(`/social/comments/${mediaId}`);
      setComments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await API.post(`/social/comment/${mediaId}`, { text });
      setComments([res.data, ...comments]);
      setText("");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="px-4 pb-4 border-t pt-3">
      {/* Add Comment */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Comment likho..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
          Post
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-gray-400 text-sm">No Comments</p>
        )}
        {comments.map((c) => (
          <div key={c._id} className="text-sm">
            <span className="font-semibold">{c.userId?.name}: </span>
            <span className="text-gray-600">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentBox;
