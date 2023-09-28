/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { Todo } from '../../types/Todo';
import { client } from '../../utils/fetchClient';

type Props = {
  USER_ID: number;
  todos: Todo[];
  setErrorMessage: (message: string) => void
  setTempTodo: (data: Todo | null) => void
  updateTodos: (newTodo: Todo) => void
  setLoadingItems: (id: (prevState: number[]) => number[]) => void
  addTodo: (todo: Todo) => void
};

export const Header: React.FC<Props> = ({
  USER_ID,
  todos,
  setErrorMessage,
  setTempTodo,
  updateTodos,
  setLoadingItems,
  addTodo,
}) => {
  const [value, setValue] = useState<string>('');
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value.trim() === '') {
      setErrorMessage('Title should not be empty');
    }

    const data = {
      userId: USER_ID,
      title: value.trim(),
      completed: false,
    };

    setIsDisabled(true);
    setTempTodo({
      ...data,
      id: 0,
    });

    setLoadingItems((prevState) => {
      return [...prevState, 0];
    });

    client
      .post<Todo>('/todos', data)
      .then((response) => {
        addTodo(response);
        setValue('');
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
      })
      .finally(() => {
        setLoadingItems((prevState) => {
          return prevState.filter((id) => id !== 0);
        });
        setTempTodo(null);
        setIsDisabled(false);
        setTimeout(() => {
          if (inputRef.current === null) {
            return;
          }

          inputRef.current.focus();
        }, 0);
      });
  };

  const handleChangeStatusOfAllTodos = () => {
    let todosToChange = todos.filter((todo) => !todo.completed);

    if (todos.every((todo) => todo.completed)
    || todos.every((todo) => !todo.completed)) {
      todosToChange = todos;
    }

    todosToChange.forEach((todo) => {
      setLoadingItems((prevState) => [...prevState, todo.id]);

      const data = {
        ...todo,
        completed: !todo.completed,
      };

      client
        .patch<Todo>(`/todos/${todo.id}`, data)
        .then(() => {
          updateTodos(data);
        })
        .catch(() => {
          setErrorMessage('Unable to update a todo');
        })
        .finally(() => {
          setLoadingItems((prevState) => prevState
            .filter((stateId) => todo.id !== stateId));
        });
    });
  };

  return (
    <header className="todoapp__header">
      {/* this buttons is active only if there are some active todos */}
      <button
        type="button"
        className={classNames('todoapp__toggle-all', {
          active: todos.every((todo) => todo.completed),
        })}
        data-cy="ToggleAllButton"
        onClick={handleChangeStatusOfAllTodos}
      />

      {/* Add a todo on form submit */}
      <form onSubmit={handleSubmit}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isDisabled}
          ref={inputRef}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </form>
    </header>
  );
};
