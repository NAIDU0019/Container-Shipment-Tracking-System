import supabase from './supabase';
import containerSchema from './container.schema';

const containerTable = 'containers';

async function createContainer(data) {
  const { error } = await supabase
    .from(containerTable)
    .insert([data]);
  if (error) {
    throw error;
  }
  return data;
}

async function getContainers() {
  const { data, error } = await supabase
    .from(containerTable)
    .select('*');
  if (error) {
    throw error;
  }
  return data;
}

async function updateContainer(id, data) {
  const { error } = await supabase
    .from(containerTable)
    .update({ id: id, ...data });
  if (error) {
    throw error;
  }
  return data;
}

async function deleteContainer(id) {
  const { error } = await supabase
    .from(containerTable)
    .delete({ id: id });
  if (error) {
    throw error;
  }
  return { message: 'Container deleted successfully' };
}

export { createContainer, getContainers, updateContainer, deleteContainer };