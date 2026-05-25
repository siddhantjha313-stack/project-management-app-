import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProjects, createProject } from '../services/api';

interface Project {
  _id: string;
  name: string;
  description: string;
  owner: { name: string };
  members: Array<{ userId: string; role: string }>;
}

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const project = await createProject(newProject);
      setProjects([...projects, project]);
      setNewProject({ name: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          + New Project
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateProject} className="mb-6 p-4 bg-gray-100 rounded">
          <input
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <textarea
            placeholder="Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Create Project
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project._id}
            onClick={() => navigate(`/project/${project._id}`)}
            className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition"
          >
            <h3 className="text-xl font-bold">{project.name}</h3>
            <p className="text-gray-600">{project.description}</p>
            <p className="text-sm text-gray-500 mt-2">By {project.owner?.name}</p>
            <p className="text-sm text-gray-500">{project.members?.length || 0} members</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;