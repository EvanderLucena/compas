import { useState, useEffect, useRef, useCallback } from 'react';
import type { Food } from '../types/food';
import { useFoodUIStore, useFoodCatalog, useDeleteFood } from '../stores/foodStore';
import { useAuthStore } from '../stores/authStore';
import {
  FoodsHeader,
  FoodGrid,
  FoodsPagination,
  CreateFoodModal,
  EditFoodCatalogModal,
  DeleteConfirmModal,
} from '../components/foods';

export function FoodsView() {
  const {
    searchQuery,
    categoryFilter,
    currentPage,
    pageSize,
    setSearchQuery,
    setCategoryFilter,
    setCurrentPage,
    createModalOpen,
    setCreateModalOpen,
    editingFoodId,
    setEditingFoodId,
  } = useFoodUIStore();

  const { data, isLoading, isError, refetch } = useFoodCatalog();
  const deleteFood = useDeleteFood();
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);
  const isReadOnly = useAuthStore((s) => Boolean(s.user?.readOnly));
  const openReadOnlyModal = useAuthStore((s) => s.openReadOnlyModal);

  // Debounced search: 300ms
  const [localQ, setLocalQ] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (val: string) => {
      setLocalQ(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(val);
      }, 300);
    },
    [setSearchQuery],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const foods = data?.content ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const total = data?.total ?? 0;

  const editingFood = editingFoodId ? (foods.find((f) => f.id === editingFoodId) ?? null) : null;

  const handleConfirmDelete = () => {
    if (deletingFood) {
      deleteFood.mutate(deletingFood.id);
      setDeletingFood(null);
    }
  };

  const handleNewFood = () => {
    if (isReadOnly) {
      openReadOnlyModal();
      return;
    }
    setCreateModalOpen(true);
  };

  const handleEditFood = (food: Food) => {
    if (isReadOnly) {
      openReadOnlyModal();
      return;
    }
    setEditingFoodId(food.id);
  };

  const handleDeleteFood = (food: Food) => {
    if (isReadOnly) {
      openReadOnlyModal();
      return;
    }
    setDeletingFood(food);
  };

  return (
    <div>
      <FoodsHeader
        searchQuery={localQ}
        onSearchChange={handleSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onNewFood={handleNewFood}
      />

      <div style={{ padding: '20px 28px 40px' }}>
        <FoodGrid
          isLoading={isLoading}
          isError={isError}
          foods={foods}
          onRefetch={() => {
            void refetch();
          }}
          onEditFood={handleEditFood}
          onDeleteFood={handleDeleteFood}
        />
        <FoodsPagination
          page={currentPage}
          pages={totalPages}
          total={total}
          pageSize={pageSize}
          onChange={setCurrentPage}
        />
      </div>

      {createModalOpen && <CreateFoodModal onClose={() => setCreateModalOpen(false)} />}
      {editingFood && (
        <EditFoodCatalogModal food={editingFood} onClose={() => setEditingFoodId(null)} />
      )}
      {deletingFood && (
        <DeleteConfirmModal
          name={deletingFood.name}
          onClose={() => setDeletingFood(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
