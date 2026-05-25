import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import Task from '../models/Task';
import Project from '../models/Project';

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority } = req.body;
    const userId = req.userId;

    // Validation
    if (!title || !projectId || !assignedTo) {
      return res.status(400).json({ message: 'Title, projectId, and assignedTo are required' });
    }

    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(m => m.userId.toString() === userId) || 
                     project.owner.toString() === userId;
    if (!isMember) {
      return res.status(403).json({ message: 'You do not have access to this project' });
    }

    const task = new Task({
      title,
      description,
      projectId,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'Medium',
      createdBy: userId
    });

    await task.save();
    await task.populate(['assignedTo', 'createdBy', 'projectId']);

    res.status(201).json({ message: 'Task created', task });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(m => m.userId.toString() === userId) || 
                     project.owner.toString() === userId;
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, priority, dueDate } = req.body;
    const userId = req.userId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    const isMember = project?.members.some(m => m.userId.toString() === userId) || 
                     project?.owner.toString() === userId;
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);

    await task.save();
    res.json({ message: 'Task updated', task });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const tasks = await Task.find({ assignedTo: userId });
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'Todo').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const done = tasks.filter(t => t.status === 'Done').length;
    const overdue = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
    ).length;

    res.json({ total, todo, inProgress, done, overdue, tasks });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};