import { useCreateHabit, useUpdateHabit } from "@/hooks/useHabits";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { CATEGORIES } from "../constants/mockData";

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  initialData?: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
  };
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ visible, onClose, initialData }) => {
  const [title, setTitle] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [selectedCategory, setSelectedCategory] = useState(
    CATEGORIES.find(c => c.icon === initialData?.icon)?.id || CATEGORIES[0].id
  );
  
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const isEdit = !!initialData;

  React.useEffect(() => {
    if (visible && initialData) {
      setTitle(initialData.name);
      setDescription(initialData.description || "");
      setSelectedCategory(CATEGORIES.find(c => c.icon === initialData.icon)?.id || CATEGORIES[0].id);
    } else if (visible && !initialData) {
      setTitle("");
      setDescription("");
      setSelectedCategory(CATEGORIES[0].id);
    }
  }, [visible, initialData]);

  const handleCreateOrUpdate = () => {
    if (!title.trim()) return;

    const category = CATEGORIES.find(c => c.id === selectedCategory);
    
    const payload = {
      name: title.trim(),
      description: description.trim() || undefined,
      icon: category?.icon || "circle",
      color: category?.color || "#3B82F6",
      frequencyType: "daily",
    };

    const options = {
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setSelectedCategory(CATEGORIES[0].id);
        onClose();
      },
    };

    if (isEdit && initialData) {
      updateHabit.mutate({ habitId: initialData.id, data: payload }, options);
    } else {
      createHabit.mutate(payload, options);
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="rounded-t-[40px] bg-white p-6 pb-12"
        >
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Habit' : 'New Habit'}</Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-6">
              <Text className="mb-2 text-sm font-semibold text-gray-500 uppercase">
                {isEdit ? 'Update Your Habit' : 'What do you want to achieve?'}
              </Text>
              <TextInput
                placeholder="e.g., Read for 30 mins"
                value={title}
                onChangeText={setTitle}
                className="rounded-2xl bg-gray-50 p-4 text-lg text-gray-900 font-outfit"
              />
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-semibold text-gray-500 uppercase">
                Description (Optional)
              </Text>
              <TextInput
                placeholder="e.g., 20 pages a day"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
                className="rounded-2xl bg-gray-50 p-4 text-gray-900 font-inter"
              />
            </View>

            <View className="mb-8">
              <Text className="mb-4 text-sm font-semibold text-gray-500 uppercase">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    className={`flex-row items-center gap-2 rounded-2xl px-4 py-3 border ${
                      selectedCategory === cat.id
                        ? "bg-blue-500 border-blue-500"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={18}
                      color={selectedCategory === cat.id ? "white" : "#6B7280"}
                    />
                    <Text
                      className={`font-medium ${
                        selectedCategory === cat.id
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}

                {/* Add Custom Category Button */}
                <Pressable
                  className="flex-row items-center gap-2 rounded-2xl px-4 py-3 border border-dashed border-gray-300 bg-gray-50"
                  onPress={() => alert("Add Custom Category UI Placeholder")}
                >
                  <Ionicons name="add" size={18} color="#6B7280" />
                  <Text className="font-medium text-gray-500">Custom</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleCreateOrUpdate}
              disabled={createHabit.isPending || updateHabit.isPending || !title.trim()}
              className={`mt-4 rounded-2xl py-5 items-center shadow-lg ${
                createHabit.isPending || updateHabit.isPending || !title.trim()
                  ? "bg-gray-400 shadow-none"
                  : "bg-[#F25E86] shadow-[#F25E86]/30"
              }`}
            >
              {createHabit.isPending || updateHabit.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-lg font-bold text-white">{isEdit ? 'Save Changes' : 'Create Habit'}</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AddHabitModal;
