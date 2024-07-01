const express = require('express');
const prisma = require('../prisma/client');

const createChecklist = async (req, res) => {
  const { title, description, items } = req.body;
  try {
    const userId = req.userId;

    if (!title || !items || !Array.isArray(items)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid request body',
      });
    }

    const createdChecklist = await prisma.checklist.create({
      data: {
        title,
        description,
        userId,
        items: {
          createMany: {
            data: items.map((item) => ({
              name: item.name,
              completed: item.completed || false,
            })),
          },
        },
      },
      include: {
        items: true,
      },
    });

    res.status(201).send({
      success: true,
      message: 'Checklist created successfully',
      data: createdChecklist,
    });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteChecklist = async (req, res) => {
  const checklistId = parseInt(req.params.id);

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    const checklist = await prisma.checklist.findUnique({
      where: {
        id: checklistId,
      },
      include: {
        user: true,
      },
    });

    if (!checklist) {
      return res.status(404).send({
        success: false,
        message: 'Checklist not found',
      });
    }

    if (checklist.userId !== userId) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to delete this checklist',
      });
    }

    await prisma.$transaction([
      prisma.item.deleteMany({
        where: {
          checklistId,
        },
      }),
      prisma.checklist.delete({
        where: {
          id: checklistId,
        },
      }),
    ]);

    res.status(200).send({
      success: true,
      message: 'Checklist and associated items deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting checklist and items:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getChecklists = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    const checklists = await prisma.checklist.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: true,
      },
    });

    res.status(200).send({
      success: true,
      message: 'List of checklists retrieved successfully',
      data: checklists,
    });
  } catch (error) {
    console.error('Error retrieving checklists:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getChecklistDetail = async (req, res) => {
  const checklistId = parseInt(req.params.id);

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    const checklist = await prisma.checklist.findUnique({
      where: {
        id: checklistId,
      },
      include: {
        items: true,
      },
    });

    if (!checklist) {
      return res.status(404).send({
        success: false,
        message: 'Checklist not found',
      });
    }

    if (checklist.userId !== userId) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to view this checklist',
      });
    }

    res.status(200).send({
      success: true,
      message: 'Checklist detail retrieved successfully',
      data: checklist,
    });
  } catch (error) {
    console.error('Error retrieving checklist detail:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const createTodoItem = async (req, res) => {
  const checklistId = parseInt(req.params.id);
  const { name, completed = false } = req.body;

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    const checklist = await prisma.checklist.findUnique({
      where: {
        id: checklistId,
      },
    });

    if (!checklist) {
      return res.status(404).send({
        success: false,
        message: 'Checklist not found',
      });
    }

    if (checklist.userId !== userId) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to add items to this checklist',
      });
    }

    const newItem = await prisma.item.create({
      data: {
        name,
        completed,
        checklistId,
      },
    });

    res.status(201).send({
      success: true,
      message: 'Todo item created successfully',
      data: newItem,
    });
  } catch (error) {
    console.error('Error creating todo item:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getTodoItems = async (req, res) => {
  const checklistId = parseInt(req.params.id);

  try {
    const todoItems = await prisma.item.findMany({
      where: {
        checklistId,
      },
    });

    res.status(200).send({
      success: true,
      message: 'Todo items retrieved successfully',
      data: todoItems,
    });
  } catch (error) {
    console.error('Error retrieving todo items:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateTodoItem = async (req, res) => {
  const itemId = parseInt(req.params.itemId);
  const { name, completed } = req.body;

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    let item = await prisma.item.findUnique({
      where: {
        id: itemId,
      },
      include: {
        checklist: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).send({
        success: false,
        message: 'Todo item not found',
      });
    }

    if (item.checklist.userId !== userId) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to update this todo item',
      });
    }

    item = await prisma.item.update({
      where: {
        id: itemId,
      },
      data: {
        name: name || item.name,
        completed: completed !== undefined ? completed : item.completed,
      },
    });

    res.status(200).send({
      success: true,
      message: 'Todo item updated successfully',
      data: item,
    });
  } catch (error) {
    console.error('Error updating todo item:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const updateTodoItemStatus = async (req, res) => {
  const itemId = parseInt(req.params.itemId);

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    let item = await prisma.item.findUnique({
      where: {
        id: itemId,
      },
      include: {
        checklist: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).send({
        success: false,
        message: 'Todo item not found',
      });
    }

    if (item.checklist.userId !== userId) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to update the status of this todo item',
      });
    }

    item = await prisma.item.update({
      where: {
        id: itemId,
      },
      data: {
        completed: !item.completed, // Toggle nilai completed dari true ke false atau sebaliknya
      },
    });

    res.status(200).send({
      success: true,
      message: 'Todo item status updated successfully',
      data: item,
    });
  } catch (error) {
    console.error('Error updating todo item status:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

const deleteTodoItem = async (req, res) => {
  const itemId = parseInt(req.params.itemId);

  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(403).send({
        success: false,
        message: 'Unauthorized',
      });
    }

    let item = await prisma.item.findUnique({
      where: {
        id: itemId,
      },
      include: {
        checklist: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).send({
        success: false,
        message: 'Todo item not found',
      });
    }

    if (item.checklist.userId !== userId) {
      return res.status(403).send({
        success: false,
        message: 'You are not authorized to delete this todo item',
      });
    }

    await prisma.item.delete({
      where: {
        id: itemId,
      },
    });

    res.status(200).send({
      success: true,
      message: 'Todo item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting todo item:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  createChecklist,
  deleteChecklist,
  getChecklists,
  getChecklistDetail,
  createTodoItem,
  getTodoItems,
  updateTodoItem,
  updateTodoItemStatus,
  deleteTodoItem,
};
