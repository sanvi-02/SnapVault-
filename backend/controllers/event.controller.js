import Event from "../models/Event.js";

export const createEvent = async (req, res) => {
  const { name, description, date, category } = req.body;

  const event = await Event.create({
    name,
    description,
    date,
    category,
    createdBy: req.user.id,
  });

  res.status(201).json(event);
};

export const getAllEvents = async (req, res) => {
  const events = await Event.find().populate("createdBy", "name email");
  res.json(events);
};

export const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    "createdBy",
    "name email"
  );
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json(event);
};

export const updateEvent = async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json(event);
};

export const deleteEvent = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ message: "Event deleted" });
};
