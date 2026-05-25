import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import Project from '../models/Project';
import User from '../models/User';

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = new Project({
      name,
      description,
      owner: userId,
      members: [{ userId, role: 'Admin' }]
    });

    await project.save();
    await project.populate('owner', 'name email');

    res.status(201).json({ message: 'Project created', project });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.userId': userId }
      ]
    })
    .populate('owner', 'name email')
    .populate('members.userId', 'name email');

    res.json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only owner or admin can add members
    const userRole = project.members.find(m => m.userId.toString() === userId)?.role;
    if (userRole !== 'Admin' && project.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    if (project.members.some(m => m.userId.equals(user._id))) {
      return res.status(409).json({ message: 'User is already a member' });
    }

    project.members.push({ userId: user._id, role: role || 'Member' });
    await project.save();

    res.json({ message: 'Member added', project });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProjectRole = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project || project.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Only project owner can update roles' });
    }

    const member = project.members.find(m => m.userId.toString() === memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await project.save();

    res.json({ message: 'Role updated', project });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};